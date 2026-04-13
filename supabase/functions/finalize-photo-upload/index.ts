import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { requirePremium } from "../_shared/premium.ts";
import { logAudit } from "../_shared/audit.ts";
import { badRequest, corsHeaders, json, methodNotAllowed, serverError } from "../_shared/http.ts";

type FinalizeBody = {
  photoId: string;
  storagePath: string;
  consentId: string;
  fileSizeBytes?: number;
  mimeType?: string;
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const { user, response } = await getUserFromRequest(request);
  if (response || !user) return response;

  const sub = await requirePremium(user.id);

  // Allow first upload during onboarding even if subscription hasn't propagated yet
  if (!sub) {
    const { count: existingPhotos } = await adminClient
      .from("photo_uploads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((existingPhotos ?? 0) > 0) {
      return json({ error: "premium_required" }, 403);
    }
  }

  let body: FinalizeBody;
  try {
    body = await request.json();
  } catch {
    return badRequest("invalid_json");
  }

  if (!body.photoId || !body.storagePath || !body.consentId) {
    return badRequest("missing_required_fields");
  }

  try {
    // Create photo_uploads record
    const { data: photo, error: photoError } = await adminClient
      .from("photo_uploads")
      .insert({
        id: body.photoId,
        user_id: user.id,
        storage_path: body.storagePath,
        bucket: "face-raw-private",
        file_size_bytes: body.fileSizeBytes ?? null,
        mime_type: body.mimeType ?? "image/jpeg",
        quality_status: "pending_review",
        consent_id: body.consentId,
      })
      .select("id")
      .single();

    if (photoError) return serverError("photo_record_failed", photoError.message);

    // Enqueue avatar validation + generation job
    const idempotencyKey = `avatar:${user.id}:${body.photoId}`;
    const { data: job, error: jobError } = await adminClient
      .from("avatar_jobs")
      .insert({
        user_id: user.id,
        photo_upload_id: photo.id,
        status: "pending",
        idempotency_key: idempotencyKey,
        prompt_version: "v1",
      })
      .select("id, status")
      .single();

    if (jobError) {
      if (String(jobError.message).includes("avatar_jobs_idempotency_key_key")) {
        return json({ status: "already_queued", photoId: photo.id });
      }
      return serverError("avatar_job_enqueue_failed", jobError.message);
    }

    // Update user avatar generation status
    await adminClient
      .from("users")
      .update({ avatar_generation_status: "processing" })
      .eq("id", user.id);

    await adminClient.from("notification_events").insert({
      user_id: user.id,
      event_key: "avatar_generation_started",
      status: "queued",
      payload: { photoId: photo.id, jobId: job.id },
    });

    await logAudit(user.id, "photo_upload_finalized", "photo_upload", photo.id);

    // Fire-and-forget: trigger the avatar processing worker
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (supabaseUrl && serviceKey) {
      fetch(`${supabaseUrl}/functions/v1/process-avatar-jobs?limit=1`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          "x-worker-secret": Deno.env.get("WORKER_SECRET") ?? "",
        },
      }).catch(() => {
        /* non-critical: cron will pick it up if this fails */
      });
    }

    return json({
      status: "queued",
      photoId: photo.id,
      jobId: job.id,
    });
  } catch (error) {
    return serverError("finalize_failed", String(error));
  }
});
