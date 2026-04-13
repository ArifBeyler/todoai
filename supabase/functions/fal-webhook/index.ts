import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient } from "../_shared/supabase.ts";
import { badRequest, corsHeaders, json, methodNotAllowed, serverError } from "../_shared/http.ts";

type FalWebhookPayload = {
  request_id?: string;
  status?: "queued" | "processing" | "completed" | "failed";
  output?: { images?: Array<{ url?: string }> };
  error?: string;
  metadata?: { job_id?: string; user_id?: string };
};

const statusToJobStatus = (status?: string) => {
  if (status === "completed") return "succeeded";
  if (status === "failed") return "failed";
  if (status === "processing") return "processing";
  return "pending";
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  let payload: FalWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return badRequest("invalid_json");
  }

  const eventId = request.headers.get("x-fal-event-id") ?? payload.request_id ?? crypto.randomUUID();
  const rawSignature = request.headers.get("x-fal-signature");
  const webhookSecret = Deno.env.get("FAL_WEBHOOK_SECRET");
  const signatureValid = webhookSecret ? rawSignature === webhookSecret : false;

  const { error: eventInsertError } = await adminClient.from("webhook_events").insert({
    provider: "fal.ai",
    event_type: payload.status ?? "unknown",
    external_event_id: eventId,
    signature_valid: signatureValid,
    payload,
  });
  if (eventInsertError) return serverError("webhook_event_insert_failed", eventInsertError.message);

  const jobId = payload.metadata?.job_id;
  if (!jobId) return json({ accepted: true, ignored: "missing_job_id" });

  const mappedStatus = statusToJobStatus(payload.status);
  const imageUrl = payload.output?.images?.[0]?.url ?? null;

  try {
    const { data: job, error: jobError } = await adminClient
      .from("generation_jobs")
      .select("id, user_id, job_type, visual_id")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError || !job) return json({ accepted: true, ignored: "job_not_found" });

    let visualId = job.visual_id ?? null;
    if (mappedStatus === "succeeded" && imageUrl && !visualId) {
      const { data: visual } = await adminClient
        .from("generated_visuals")
        .insert({
          user_id: job.user_id,
          image_url: imageUrl,
          thumbnail_url: imageUrl,
          prompt_used: "provider_result",
          style_used: "nano-banana-2-premium-v1",
          status: "success",
          generation_date: new Date().toISOString().slice(0, 10),
        })
        .select("id")
        .single();
      visualId = visual?.id ?? null;
    }

    await adminClient
      .from("generation_jobs")
      .update({
        status: mappedStatus,
        visual_id: visualId,
        provider_response: payload,
        provider_job_id: payload.request_id ?? null,
        last_error: payload.error ?? null,
        finished_at: mappedStatus === "succeeded" || mappedStatus === "failed" ? new Date().toISOString() : null,
        lease_owner: null,
        lease_expires_at: null,
      })
      .eq("id", jobId);

    if (mappedStatus === "failed") {
      await adminClient.from("notification_events").insert({
        user_id: job.user_id,
        event_key: "generation_failed_retry_available",
        status: "queued",
        payload: { jobId, provider: "fal.ai", reason: payload.error ?? "unknown" },
      });
    }

    if (mappedStatus === "succeeded") {
      await adminClient.from("notification_events").insert({
        user_id: job.user_id,
        event_key: job.job_type === "avatar" ? "avatar_ready" : "daily_visual_ready",
        status: "queued",
        payload: { jobId, visualId },
      });
    }

    await adminClient
      .from("webhook_events")
      .update({ process_status: "processed", processed_at: new Date().toISOString() })
      .eq("external_event_id", eventId);

    return json({ accepted: true, jobId, mappedStatus });
  } catch (error) {
    await adminClient
      .from("webhook_events")
      .update({ process_status: "failed", process_error: String(error), processed_at: new Date().toISOString() })
      .eq("external_event_id", eventId);
    return serverError("webhook_process_failed", String(error));
  }
});
