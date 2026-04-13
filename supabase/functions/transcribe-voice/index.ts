import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, json, badRequest, methodNotAllowed, serverError } from "../_shared/http.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { trackBackendEvent } from "../_shared/analytics.ts";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const { user, response: authError } = await getUserFromRequest(request);
  if (authError) return authError;
  if (!user) return json({ error: "unauthorized" }, 401);

  if (!ELEVENLABS_API_KEY) {
    return serverError("elevenlabs_not_configured", "ElevenLabs API key missing");
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) ?? "tr";

    if (!audioFile) return badRequest("Audio file required");

    const elevenLabsForm = new FormData();
    elevenLabsForm.append("audio", audioFile);
    elevenLabsForm.append("model_id", "scribe_v1");
    elevenLabsForm.append("language_code", language);

    const sttResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
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
    const transcript = sttResult.text ?? "";
    const confidence = sttResult.language_probability ?? 0;

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
