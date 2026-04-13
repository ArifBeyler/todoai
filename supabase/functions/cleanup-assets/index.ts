import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient } from "../_shared/supabase.ts";
import { logAudit } from "../_shared/audit.ts";
import { corsHeaders, json, methodNotAllowed, serverError, unauthorized } from "../_shared/http.ts";

const RAW_PHOTO_RETENTION_DAYS = 30;

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && request.headers.get("x-cron-secret") !== cronSecret) {
    return unauthorized();
  }

  try {
    let deletedPhotos = 0;
    let releasedLeases = 0;
    let deadLettered = 0;

    // 1. Clean up old raw face photos past retention
    const cutoff = new Date(Date.now() - RAW_PHOTO_RETENTION_DAYS * 86_400_000).toISOString();
    const { data: oldPhotos } = await adminClient
      .from("photo_uploads")
      .select("id, user_id, storage_path, bucket")
      .lt("created_at", cutoff)
      .in("quality_status", ["accepted", "reupload_required", "rejected"]);

    for (const photo of oldPhotos ?? []) {
      await adminClient.storage.from(photo.bucket).remove([photo.storage_path]);
      await adminClient.from("photo_uploads").delete().eq("id", photo.id);
      deletedPhotos += 1;
    }

    // 2. Clean up revoked consent photos immediately
    const { data: revokedConsents } = await adminClient
      .from("user_consents")
      .select("id, user_id")
      .eq("consent_type", "face_processing")
      .not("revoked_at", "is", null);

    for (const consent of revokedConsents ?? []) {
      const { data: photos } = await adminClient
        .from("photo_uploads")
        .select("id, storage_path, bucket")
        .eq("consent_id", consent.id);

      for (const photo of photos ?? []) {
        await adminClient.storage.from(photo.bucket).remove([photo.storage_path]);
        await adminClient.from("photo_uploads").delete().eq("id", photo.id);
        deletedPhotos += 1;
      }

      await logAudit(consent.user_id, "consent_revoke_cleanup", "user_consent", consent.id);
    }

    // 3. Release stale leases on generation_jobs
    const { data: staleGenJobs } = await adminClient
      .from("generation_jobs")
      .select("id")
      .eq("status", "leased")
      .lt("lease_expires_at", new Date().toISOString());

    for (const job of staleGenJobs ?? []) {
      await adminClient
        .from("generation_jobs")
        .update({ status: "pending", lease_owner: null, lease_expires_at: null })
        .eq("id", job.id);
      releasedLeases += 1;
    }

    // 4. Release stale leases on avatar_jobs
    const { data: staleAvatarJobs } = await adminClient
      .from("avatar_jobs")
      .select("id")
      .eq("status", "leased")
      .lt("locked_until", new Date().toISOString());

    for (const job of staleAvatarJobs ?? []) {
      await adminClient
        .from("avatar_jobs")
        .update({ status: "pending", locked_by: null, locked_until: null })
        .eq("id", job.id);
      releasedLeases += 1;
    }

    // 5. Dead-letter failed jobs with exhausted attempts
    const { data: failedGenJobs } = await adminClient
      .from("generation_jobs")
      .select("id")
      .eq("status", "failed")
      .lt("updated_at", new Date(Date.now() - 86_400_000).toISOString());

    for (const job of failedGenJobs ?? []) {
      deadLettered += 1;
    }

    const { data: failedAvatarJobs } = await adminClient
      .from("avatar_jobs")
      .select("id, attempt_count, max_attempts")
      .eq("status", "failed");

    for (const job of failedAvatarJobs ?? []) {
      if (job.attempt_count >= job.max_attempts) {
        await adminClient
          .from("avatar_jobs")
          .update({ status: "dead_letter" })
          .eq("id", job.id);
        deadLettered += 1;
      }
    }

    return json({
      cleanup: true,
      deletedPhotos,
      releasedLeases,
      deadLettered,
    });
  } catch (error) {
    return serverError("cleanup_error", String(error));
  }
});
