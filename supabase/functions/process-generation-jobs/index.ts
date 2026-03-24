import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient } from "../_shared/supabase.ts";
import { corsHeaders, json, methodNotAllowed, serverError, unauthorized } from "../_shared/http.ts";

type ClaimedJob = {
  id: string;
  user_id: string;
  job_type: "avatar" | "daily_scene" | "regenerate";
  attempts: number;
  max_attempts: number;
  payload: Record<string, unknown>;
  prompt_version: string;
};

const WORKER_NAME = `worker-${crypto.randomUUID().slice(0, 8)}`;

const updateJobAsFailed = async (job: ClaimedJob, message: string) => {
  const reachedMaxAttempts = job.attempts + 1 >= job.max_attempts;
  await adminClient
    .from("generation_jobs")
    .update({
      status: reachedMaxAttempts ? "failed" : "pending",
      attempts: job.attempts + 1,
      last_error: message,
      available_at: reachedMaxAttempts
        ? new Date().toISOString()
        : new Date(Date.now() + 60_000 * (job.attempts + 1)).toISOString(),
      lease_owner: null,
      lease_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  await adminClient.from("notification_events").insert({
    user_id: job.user_id,
    event_key: reachedMaxAttempts ? "generation_failed_retry_available" : "generation_retry_scheduled",
    status: "queued",
    payload: { jobId: job.id, reason: message, attempts: job.attempts + 1 },
  });
};

const completeJob = async (job: ClaimedJob) => {
  const nowIso = new Date().toISOString();
  const today = nowIso.slice(0, 10);
  const promptSnapshot =
    job.job_type === "avatar"
      ? "Create premium stylized portrait preserving user identity."
      : "Create premium lifestyle scene where user embodies selected tasks.";
  const generatedImageUrl = `https://picsum.photos/seed/${encodeURIComponent(job.id)}/1024/1024`;

  const { data: visual, error: visualError } = await adminClient
    .from("generated_visuals")
    .insert({
      user_id: job.user_id,
      image_url: generatedImageUrl,
      thumbnail_url: generatedImageUrl,
      prompt_used: promptSnapshot,
      style_used: "nano-banana-premium-v1",
      status: "success",
      generation_date: today,
    })
    .select("id")
    .single();

  if (visualError || !visual) {
    await updateJobAsFailed(job, visualError?.message ?? "visual_insert_failed");
    return { status: "failed", reason: "visual_insert_failed" };
  }

  await adminClient
    .from("generation_jobs")
    .update({
      status: "succeeded",
      attempts: job.attempts + 1,
      visual_id: visual.id,
      prompt_snapshot: promptSnapshot,
      finished_at: nowIso,
      lease_owner: null,
      lease_expires_at: null,
      updated_at: nowIso,
    })
    .eq("id", job.id);

  if (job.job_type === "avatar") {
    await adminClient
      .from("users")
      .update({ avatar_generation_status: "succeeded", avatar_visual_id: visual.id })
      .eq("id", job.user_id);
  }

  await adminClient.from("cost_ledger").insert({
    user_id: job.user_id,
    job_id: job.id,
    provider: "fal.ai",
    cost_usd: 0.02,
    image_count: 1,
    metadata: { simulated: true, promptVersion: job.prompt_version, jobType: job.job_type },
  });

  await adminClient.from("notification_events").insert({
    user_id: job.user_id,
    event_key: job.job_type === "avatar" ? "avatar_ready" : "daily_visual_ready",
    status: "queued",
    payload: { jobId: job.id, visualId: visual.id },
  });

  return { status: "succeeded", visualId: visual.id };
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const workerSecret = Deno.env.get("WORKER_SECRET");
  if (workerSecret && request.headers.get("x-worker-secret") !== workerSecret) {
    return unauthorized();
  }

  const limitRaw = new URL(request.url).searchParams.get("limit") ?? "5";
  const limit = Number.isFinite(Number(limitRaw)) ? Math.min(Number(limitRaw), 25) : 5;

  try {
    const { data: jobs, error: claimError } = await adminClient.rpc("claim_generation_jobs", {
      worker_name: WORKER_NAME,
      max_jobs: limit,
    });

    if (claimError) return serverError("job_claim_failed", claimError.message);
    if (!jobs || jobs.length === 0) return json({ claimed: 0, processed: [] });

    const processed: Array<Record<string, unknown>> = [];
    for (const job of jobs as ClaimedJob[]) {
      await adminClient.from("generation_job_attempts").insert({
        job_id: job.id,
        attempt_number: job.attempts + 1,
        outcome: "processing",
      });

      await adminClient
        .from("generation_jobs")
        .update({
          status: "processing",
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      const result = await completeJob(job);
      await adminClient
        .from("generation_job_attempts")
        .update({
          outcome: String(result.status),
          finished_at: new Date().toISOString(),
          provider_response: result,
        })
        .eq("job_id", job.id)
        .eq("attempt_number", job.attempts + 1);
      processed.push({ jobId: job.id, ...result });
    }

    return json({ claimed: jobs.length, processed, worker: WORKER_NAME });
  } catch (error) {
    return serverError("unexpected_worker_error", String(error));
  }
});
