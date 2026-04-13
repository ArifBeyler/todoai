import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, json, badRequest, methodNotAllowed, serverError } from "../_shared/http.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { trackBackendEvent } from "../_shared/analytics.ts";
import { FAL_MODELS, runFalQueueJob, uint8ToBase64 } from "../_shared/fal.ts";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const FAL_KEY = Deno.env.get("FAL_KEY") ?? "";

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const { user, response: authError } = await getUserFromRequest(request);
  if (authError) return authError;
  if (!user) return json({ error: "unauthorized" }, 401);

  if (!FAL_KEY && !ELEVENLABS_API_KEY) {
    return serverError("stt_not_configured", "Set FAL_KEY or ELEVENLABS_API_KEY in Edge Function secrets");
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) ?? "tr";

    if (!audioFile) return badRequest("Audio file required");

    let transcript = "";
    let confidence = 0;

    if (FAL_KEY) {
      const buf = await audioFile.arrayBuffer();
      const bytes = new Uint8Array(buf);
      const mime = audioFile.type || "audio/m4a";
      const audio_url = `data:${mime};base64,${uint8ToBase64(bytes)}`;

      const whisperLang = language === "en" ? "en" : "tr";
      const falResult = await runFalQueueJob<{ text: string; inferred_languages?: string[] }>(
        FAL_MODELS.whisper,
        {
          audio_url,
          task: "transcribe",
          language: whisperLang,
          chunk_level: "none",
        },
        90_000,
      );

      if ("error" in falResult) {
        await trackBackendEvent(user.id, "voice_input_failed", {
          error: "fal_whisper_failed",
          detail: falResult.error,
        });
        if (!ELEVENLABS_API_KEY) {
          return serverError("stt_failed", falResult.error);
        }
        // Fallback to ElevenLabs below
      } else {
        transcript = falResult.data.text ?? "";
        confidence = transcript.length > 0 ? 0.95 : 0;
      }
    }

    if (!transcript.trim() && ELEVENLABS_API_KEY) {
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
        await trackBackendEvent(user.id, "voice_input_failed", {
          error: "stt_api_error",
          status: sttResponse.status,
        });
        return serverError("stt_failed", errorText);
      }

      const sttResult = await sttResponse.json();
      transcript = sttResult.text ?? "";
      confidence = sttResult.language_probability ?? 0;
    }

    if (!transcript.trim()) {
      return badRequest("empty_transcript");
    }

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

    return json({
      transcript,
      confidence,
      language,
    });
  } catch (err) {
    await trackBackendEvent(user.id, "voice_input_failed", {
      error: String(err),
    });
    return serverError("transcribe_failed", String(err));
  }
});
