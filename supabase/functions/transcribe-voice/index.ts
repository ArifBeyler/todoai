import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, json, badRequest, methodNotAllowed, serverError } from "../_shared/http.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { trackBackendEvent } from "../_shared/analytics.ts";
import { FAL_MODELS, runFalSync, uint8ToBase64 } from "../_shared/fal.ts";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const FAL_KEY = Deno.env.get("FAL_KEY") ?? "";

// Max base64 size to send to FAL sync (~8 MB audio → ~11 MB base64)
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const { user, response: authError } = await getUserFromRequest(request);
  if (authError) return authError;
  if (!user) return json({ error: "unauthorized" }, 401);

  if (!FAL_KEY && !ELEVENLABS_API_KEY) {
    return json({ error: "stt_not_configured" }, 503);
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) ?? "tr";

    if (!audioFile) return badRequest("Audio file required");

    let transcript = "";
    let confidence = 0;

    // ── Primary: FAL Whisper (sync, no queue polling) ─────────────────────────
    if (FAL_KEY) {
      const buf = await audioFile.arrayBuffer();

      console.log(
        `[transcribe-voice] Audio received: ${buf.byteLength} bytes, type: "${audioFile.type || "unknown"}", language: ${language}`,
      );

      // Guard: reject obviously empty files (simulator recordings, corrupted uploads)
      if (buf.byteLength < 500) {
        console.warn(
          `[transcribe-voice] Audio too short: ${buf.byteLength} bytes — likely simulator or empty recording.`,
        );
        await trackBackendEvent(user.id, "voice_input_failed", {
          error: "audio_too_short",
          size: buf.byteLength,
        });
        return json({ error: "audio_too_short", detail: `${buf.byteLength} bytes received` }, 400);
      }

      if (buf.byteLength > MAX_AUDIO_BYTES) {
        await trackBackendEvent(user.id, "voice_input_failed", {
          error: "audio_too_large",
          size: buf.byteLength,
        });
        return json({ error: "audio_too_large" }, 413);
      }

      const bytes = new Uint8Array(buf);
      const mime = audioFile.type || "audio/m4a";
      const audio_url = `data:${mime};base64,${uint8ToBase64(bytes)}`;

      const whisperLang = language === "en" ? "en" : "tr";
      const falResult = await runFalSync<{ text: string; inferred_languages?: string[] }>(
        FAL_MODELS.whisper,
        {
          audio_url,
          task: "transcribe",
          language: whisperLang,
          chunk_level: "none",
        },
      );

      if ("error" in falResult) {
        console.error("[transcribe-voice] FAL Whisper error:", falResult.error);
        await trackBackendEvent(user.id, "voice_input_failed", {
          error: "fal_whisper_failed",
          detail: falResult.error,
        });
        if (!ELEVENLABS_API_KEY) {
          return json({ error: "transcription_failed", detail: falResult.error }, 502);
        }
        // Fallback to ElevenLabs below
      } else {
        transcript = falResult.data.text ?? "";
        confidence = transcript.length > 0 ? 0.95 : 0;
        console.log(
          `[transcribe-voice] FAL Whisper success. Transcript length: ${transcript.length}, confidence: ${confidence}`,
        );
      }
    }

    // ── Fallback: ElevenLabs STT ───────────────────────────────────────────────
    if (!transcript.trim() && ELEVENLABS_API_KEY) {
      console.log("[transcribe-voice] FAL sonuç yok, ElevenLabs fallback deneniyor...");
      const elevenLabsForm = new FormData();
      elevenLabsForm.append("audio", audioFile);
      elevenLabsForm.append("model_id", "scribe_v1");
      elevenLabsForm.append("language_code", language);

      const sttResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: { "xi-api-key": ELEVENLABS_API_KEY! },
        body: elevenLabsForm,
      });

      if (!sttResponse.ok) {
        const errorText = await sttResponse.text();
        console.error("[transcribe-voice] ElevenLabs error:", sttResponse.status, errorText);
        await trackBackendEvent(user.id, "voice_input_failed", {
          error: "elevenlabs_error",
          status: sttResponse.status,
        });
        return json({ error: "transcription_failed", detail: errorText }, 502);
      }

      const sttResult = await sttResponse.json();
      transcript = sttResult.text ?? "";
      confidence = sttResult.language_probability ?? 0;
      console.log(
        `[transcribe-voice] ElevenLabs success. Transcript length: ${transcript.length}, confidence: ${confidence}`,
      );
    }

    if (!transcript.trim()) {
      return json({ error: "empty_transcript" }, 400);
    }

    // ── Persist & track ───────────────────────────────────────────────────────
    await adminClient.from("voice_inputs").insert({
      user_id: user.id,
      transcript,
      language,
      confidence,
      duration_ms: Math.round((audioFile.size / 16000) * 1000),
      parsed_result: {},
    });

    await trackBackendEvent(user.id, "voice_input_completed", {
      language,
      confidence,
      transcriptLength: transcript.length,
      provider: FAL_KEY ? "fal_whisper" : "elevenlabs",
    });

    return json({ transcript, confidence, language });
  } catch (err) {
    await trackBackendEvent(user.id, "voice_input_failed", { error: String(err) });
    return serverError("transcribe_failed", String(err));
  }
});
