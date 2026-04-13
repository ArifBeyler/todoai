import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient } from "../_shared/supabase.ts";
import { corsHeaders, json, methodNotAllowed, serverError, unauthorized } from "../_shared/http.ts";
import { logAudit } from "../_shared/audit.ts";
import { runFalAndWait, FAL_MODELS } from "../_shared/fal.ts";

type ClaimedJob = {
  id: string;
  user_id: string;
  job_type: "avatar" | "daily_scene" | "todo_scene" | "hero_portrait" | "regenerate";
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

const ELIGIBLE_JOB_TYPES: ClaimedJob["job_type"][] = ["daily_scene", "todo_scene", "hero_portrait"];

const revalidateEligibility = async (job: ClaimedJob): Promise<{ valid: boolean; reason?: string }> => {
  if (!ELIGIBLE_JOB_TYPES.includes(job.job_type)) return { valid: true };

  // Re-check subscription
  const { data: sub } = await adminClient
    .from("subscriptions")
    .select("status")
    .eq("user_id", job.user_id)
    .maybeSingle();

  if (!sub || !["trialing", "active", "grace"].includes(sub.status)) {
    return { valid: false, reason: "subscription_expired_during_processing" };
  }

  // Re-check avatar
  const { data: avatar } = await adminClient
    .from("avatars")
    .select("id")
    .eq("user_id", job.user_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!avatar) return { valid: false, reason: "avatar_missing" };

  return { valid: true };
};

// ── Hero Portrait Prompt (avatarPortrait mode) ──────────────────────

const HERO_PORTRAIT_PROMPT = [
  "Transform the uploaded user photo into a high-quality premium pixel-art profile avatar portrait.",
  "Keep the person clearly recognizable: preserve the exact face shape, hairstyle, hair color, facial hair if present, glasses if present, skin tone, and overall age.",
  "The character must face directly forward, looking straight into the camera with level eyes centered in the frame.",
  "Use a centered head-and-shoulders composition only — the head should occupy most of the frame.",
  "Keep the portrait symmetrical, clean, iconic, and highly readable at small sizes.",
  "Use a solid black background with no environment, no scene elements, no props, and no objects.",
  "Do not include hands, full body, action poses, or any text.",
  "The final result should look like a polished game profile icon or character select portrait.",
  "Style: detailed pixel art with rich shading, subtle highlights, and clean anti-aliased edges.",
].join(" ");

// ── Task Scene Prompt ───────────────────────────────────────────────

const TASK_SCENE_BG_DIRECTIVE =
  "on a clean solid light warm gray background (#F2F2F0), no complex scenery, no room, no landscape, only the character";

const buildTaskScenePrompt = async (job: ClaimedJob): Promise<string> => {
  const { data: user } = await adminClient
    .from("users")
    .select("display_name")
    .eq("id", job.user_id)
    .maybeSingle();

  const userName = user?.display_name ?? "User";
  const todoTitle = (job.payload?.todo_title as string) ?? null;

  if (todoTitle) {
    return [
      `Transform this pixel art avatar into a full-body pixel art scene of ${userName} ${todoTitle}.`,
      "Keep the same face, hairstyle, and recognisable features from the avatar image.",
      "Retro lofi pixel art style, true 8-bit/16-bit visible pixel blocks, crisp pixel edges, subtle dithering.",
      "Warm muted color palette, cozy nostalgic atmosphere.",
      TASK_SCENE_BG_DIRECTIVE,
      "No photorealism, no smooth gradients, no text, no watermark.",
      "Ultra high quality pixel art illustration.",
    ].join(" ");
  }

  const { data: completions } = await adminClient
    .from("task_completions")
    .select("task_instances(title)")
    .eq("user_id", job.user_id)
    .order("completed_at", { ascending: false })
    .limit(5);

  const taskTitles = (completions ?? [])
    .map((c: Record<string, unknown>) => {
      const ti = c.task_instances as Record<string, unknown> | null;
      return ti?.title as string | undefined;
    })
    .filter(Boolean);

  const taskList = taskTitles.length > 0
    ? taskTitles.join(", ")
    : "daily productivity tasks";

  return [
    `Transform this pixel art avatar into a full-body pixel art scene of ${userName} celebrating completing their goals (${taskList}).`,
    "Keep the same face, hairstyle, and recognisable features from the avatar image.",
    "Retro lofi pixel art style, true 8-bit/16-bit visible pixel blocks, crisp pixel edges, subtle dithering.",
    "Warm muted color palette, cozy nostalgic atmosphere.",
    TASK_SCENE_BG_DIRECTIVE,
    "No photorealism, no smooth gradients, no text, no watermark.",
    "Ultra high quality pixel art illustration.",
  ].join(" ");
};

// ── Prompt Router ───────────────────────────────────────────────────

const buildPromptForJob = async (job: ClaimedJob): Promise<string> => {
  if (job.job_type === "hero_portrait") return HERO_PORTRAIT_PROMPT;
  return buildTaskScenePrompt(job);
};

const getActiveAvatarUrl = async (userId: string): Promise<string | null> => {
  const { data: avatar } = await adminClient
    .from("avatars")
    .select("image_url, storage_path")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!avatar) return null;

  if (avatar.image_url?.startsWith("http")) return avatar.image_url;

  const { data: signed } = await adminClient.storage
    .from("avatars-private")
    .createSignedUrl(avatar.storage_path, 600);

  return signed?.signedUrl ?? null;
};

const getSourcePhotoUrl = async (
  userId: string,
  opts?: { squareCrop?: boolean },
): Promise<string | null> => {
  const { data: photo } = await adminClient
    .from("photo_uploads")
    .select("storage_path")
    .eq("user_id", userId)
    .eq("quality_status", "accepted")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!photo?.storage_path) return null;

  if (opts?.squareCrop) {
    const { data: transformed } = await adminClient.storage
      .from("face-raw-private")
      .createSignedUrl(photo.storage_path, 600, {
        transform: { width: 1024, height: 1024, resize: "cover" },
      });
    if (transformed?.signedUrl) return transformed.signedUrl;
  }

  const { data: signed } = await adminClient.storage
    .from("face-raw-private")
    .createSignedUrl(photo.storage_path, 600);

  return signed?.signedUrl ?? null;
};

const resolveReferenceImageUrl = async (job: ClaimedJob): Promise<string | null> => {
  if (job.job_type === "hero_portrait") {
    return await getSourcePhotoUrl(job.user_id, { squareCrop: true });
  }
  return await getActiveAvatarUrl(job.user_id);
};

const completeJob = async (job: ClaimedJob) => {
  const eligibility = await revalidateEligibility(job);
  if (!eligibility.valid) {
    await adminClient
      .from("generation_jobs")
      .update({
        status: "cancelled",
        last_error: eligibility.reason,
        finished_at: new Date().toISOString(),
        lease_owner: null,
        lease_expires_at: null,
      })
      .eq("id", job.id);
    return { status: "cancelled_by_revalidation", reason: eligibility.reason };
  }

  const nowIso = new Date().toISOString();
  const today = nowIso.slice(0, 10);

  const promptSnapshot = await buildPromptForJob(job);
  const referenceImageUrl = await resolveReferenceImageUrl(job);

  const isHeroPortrait = job.job_type === "hero_portrait";

  const falInput: Record<string, unknown> = {
    prompt: promptSnapshot,
    num_images: 1,
    aspect_ratio: isHeroPortrait ? "1:1" : "16:9",
    output_format: "png",
    resolution: "2K",
  };

  if (referenceImageUrl) {
    falInput.image_urls = [referenceImageUrl];
  }

  const model = referenceImageUrl
    ? FAL_MODELS.nano_banana_edit
    : FAL_MODELS.nano_banana;

  const falResult = await runFalAndWait(model, falInput);

  if ("error" in falResult) {
    await updateJobAsFailed(job, falResult.error);
    return { status: "failed", reason: falResult.error };
  }

  const generatedImageUrl = falResult.imageUrl;
  const usedModel = model;

  const storagePath = `${job.user_id}/${today}_${job.id}.jpg`;
  let finalImageUrl = generatedImageUrl;

  try {
    const imageRes = await fetch(generatedImageUrl);
    const imageBlob = await imageRes.blob();
    const imageBuffer = new Uint8Array(await imageBlob.arrayBuffer());

    const { error: storageErr } = await adminClient.storage
      .from("daily-visuals-private")
      .upload(storagePath, imageBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (!storageErr) {
      finalImageUrl = storagePath;
    }
  } catch {
    // Keep using the direct fal.ai URL if storage upload fails
  }

  const styleUsed = isHeroPortrait
    ? "avatar-portrait-v1"
    : "nano-banana-lofi-pixel";

  const { data: visual, error: visualError } = await adminClient
    .from("generated_visuals")
    .insert({
      user_id: job.user_id,
      image_url: finalImageUrl,
      thumbnail_url: finalImageUrl,
      prompt_used: promptSnapshot,
      style_used: styleUsed,
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

  const isVisualJob = job.job_type === "daily_scene"
    || job.job_type === "todo_scene"
    || job.job_type === "hero_portrait";

  if (isVisualJob) {
    const visualDate = (job.payload?.target_date as string) ?? today;
    const activateAsHero = job.job_type === "daily_scene" || job.job_type === "hero_portrait";

    if (activateAsHero) {
      await adminClient
        .from("daily_visuals")
        .update({ is_hero_active: false })
        .eq("user_id", job.user_id)
        .eq("is_hero_active", true);
    }

    await adminClient.from("daily_visuals").upsert(
      {
        user_id: job.user_id,
        job_id: job.id,
        visual_date: visualDate,
        image_url: finalImageUrl,
        thumbnail_url: finalImageUrl,
        prompt_version: job.prompt_version,
        model_version: usedModel,
        style_version: styleUsed,
        is_hero_active: activateAsHero,
      },
      { onConflict: "user_id,visual_date" },
    );
  }

  await adminClient.from("cost_ledger").insert({
    user_id: job.user_id,
    job_id: job.id,
    provider: "fal.ai",
    cost_usd: 0.039,
    image_count: 1,
    metadata: {
      promptVersion: job.prompt_version,
      jobType: job.job_type,
      model: usedModel,
      generationMode: isHeroPortrait ? "avatarPortrait" : "taskScene",
      todoId: job.payload?.todo_id,
      todoTitle: job.payload?.todo_title,
    },
  });

  const eventKeyMap: Record<string, string> = {
    avatar: "avatar_ready",
    todo_scene: "todo_visual_ready",
    hero_portrait: "hero_portrait_ready",
    daily_scene: "daily_visual_ready",
  };
  const eventKey = eventKeyMap[job.job_type] ?? "daily_visual_ready";
  await adminClient.from("notification_events").insert({
    user_id: job.user_id,
    event_key: eventKey,
    status: "queued",
    payload: { jobId: job.id, visualId: visual.id },
  });

  await logAudit(job.user_id, `${job.job_type}_generation_succeeded`, "generation_job", job.id);

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
  const limit = Math.min(Math.max(Number(limitRaw) || 5, 1), 25);

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
