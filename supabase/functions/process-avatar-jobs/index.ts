import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/* ── Inline: http helpers ── */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-idempotency-key, x-fal-signature",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const methodNotAllowed = () => json({ error: "method_not_allowed" }, 405);
const unauthorized = () => json({ error: "unauthorized" }, 401);
const serverError = (message: string, details?: unknown) =>
  json({ error: "server_error", message, details }, 500);

/* ── Inline: supabase clients ── */
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

/* ── Inline: audit ── */
const logAudit = async (
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
) => {
  await adminClient.from("audit_logs").insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? {},
    ip_address: ipAddress,
  });
};

/* ── Inline: fal.ts ── */
const FAL_KEY = Deno.env.get("FAL_KEY") ?? "";
const FAL_BASE = "https://queue.fal.run";

type FalSubmitResponse = {
  request_id: string;
  status?: string;
  status_url?: string;
  response_url?: string;
  images?: Array<{ url: string; content_type?: string }>;
  image?: { url: string };
};
type FalStatusResponse = {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  response_url?: string;
  error?: string;
};
type FalResultResponse = {
  images?: Array<{ url: string; content_type?: string }>;
  image?: { url: string };
  error?: string;
};

const falHeaders = () => ({
  Authorization: `Key ${FAL_KEY}`,
  "Content-Type": "application/json",
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const runFalAndWait = async (
  model: string,
  input: Record<string, unknown>,
  maxWaitMs = 60_000,
): Promise<{ imageUrl: string } | { error: string }> => {
  if (!FAL_KEY) return { error: "FAL_KEY not configured" };

  console.log(`[fal] Submitting to ${model}`);
  const submitRes = await fetch(`${FAL_BASE}/${model}`, {
    method: "POST",
    headers: falHeaders(),
    body: JSON.stringify(input),
  });

  const submitText = await submitRes.text();
  if (!submitRes.ok) {
    console.warn(`[fal] submit ${submitRes.status}: ${submitText.slice(0, 300)}`);
    return { error: `fal submit failed (${submitRes.status}): ${submitText.slice(0, 200)}` };
  }

  let submitData: FalSubmitResponse;
  try {
    submitData = JSON.parse(submitText);
  } catch {
    console.warn(`[fal] submit parse error: ${submitText.slice(0, 200)}`);
    return { error: "invalid_submit_response" };
  }

  const immediateUrl = submitData.images?.[0]?.url ?? submitData.image?.url;
  if (immediateUrl) {
    console.log(`[fal] Got immediate result`);
    return { imageUrl: immediateUrl };
  }

  if (!submitData.request_id) {
    console.warn(`[fal] No request_id in response: ${submitText.slice(0, 300)}`);
    return { error: "no_request_id_in_response" };
  }

  const requestId = submitData.request_id;
  const statusUrl = submitData.status_url ?? `${FAL_BASE}/${model}/requests/${requestId}/status`;
  const responseUrl = submitData.response_url ?? `${FAL_BASE}/${model}/requests/${requestId}/response`;
  console.log(`[fal] Submitted, requestId: ${requestId}`);
  console.log(`[fal] statusUrl: ${statusUrl}`);
  console.log(`[fal] responseUrl: ${responseUrl}`);

  const deadline = Date.now() + maxWaitMs;
  let pollInterval = 2_000;

  while (Date.now() < deadline) {
    await sleep(pollInterval);

    const statusRes = await fetch(statusUrl, {
      headers: { Authorization: `Key ${FAL_KEY}` },
    });
    const statusText = await statusRes.text();

    if (!statusRes.ok) {
      console.warn(`[fal] status ${statusRes.status}: ${statusText.slice(0, 200)}`);
      return { error: `poll_status_${statusRes.status}: ${statusText.slice(0, 100)}` };
    }

    let statusData: FalStatusResponse;
    try {
      statusData = JSON.parse(statusText);
    } catch {
      console.warn(`[fal] status parse error: ${statusText.slice(0, 200)}`);
      return { error: "invalid_status_response" };
    }

    console.log(`[fal] Status: ${statusData.status}`);

    if (statusData.status === "COMPLETED") {
      const resultRes = await fetch(responseUrl, {
        headers: { Authorization: `Key ${FAL_KEY}` },
      });
      const resultText = await resultRes.text();

      if (!resultRes.ok) {
        console.warn(`[fal] result ${resultRes.status}: ${resultText.slice(0, 200)}`);
        return { error: `get_result_${resultRes.status}` };
      }

      let resultData: FalResultResponse;
      try {
        resultData = JSON.parse(resultText);
      } catch {
        console.warn(`[fal] result parse error: ${resultText.slice(0, 200)}`);
        return { error: "invalid_result_response" };
      }

      const url = resultData.images?.[0]?.url ?? resultData.image?.url;
      if (url) return { imageUrl: url };
      console.warn(`[fal] No image URL in result: ${resultText.slice(0, 300)}`);
      return { error: "no image in fal response" };
    }

    if (statusData.status === "FAILED") {
      return { error: statusData.error ?? "fal job failed" };
    }

    pollInterval = Math.min(pollInterval * 1.3, 8_000);
  }

  return { error: "fal job timed out" };
};

const FAL_MODEL_EDIT = "fal-ai/nano-banana-2/edit";

/* ── Types ── */
type ClaimedAvatarJob = {
  id: string;
  user_id: string;
  photo_upload_id: string | null;
  attempt_count: number;
  max_attempts: number;
  prompt_version: string;
  provider: string;
};

const WORKER_NAME = `avatar-worker-${crypto.randomUUID().slice(0, 8)}`;

const failJob = async (job: ClaimedAvatarJob, message: string) => {
  const reachedMax = job.attempt_count + 1 >= job.max_attempts;
  const nextStatus = reachedMax ? "dead_letter" : "pending";

  await adminClient
    .from("avatar_jobs")
    .update({
      status: nextStatus,
      attempt_count: job.attempt_count + 1,
      last_error: message,
      next_run_at: reachedMax
        ? new Date().toISOString()
        : new Date(Date.now() + 60_000 * (job.attempt_count + 1)).toISOString(),
      locked_by: null,
      locked_until: null,
    })
    .eq("id", job.id);

  if (reachedMax) {
    await adminClient
      .from("users")
      .update({ avatar_generation_status: "failed" })
      .eq("id", job.user_id);
  }

  await adminClient.from("notification_events").insert({
    user_id: job.user_id,
    event_key: reachedMax ? "generation_failed_retry_available" : "generation_retry_scheduled",
    status: "queued",
    payload: { jobId: job.id, reason: message, attempts: job.attempt_count + 1 },
  });
};

const validatePhoto = async (job: ClaimedAvatarJob): Promise<{ valid: boolean; reason?: string }> => {
  if (!job.photo_upload_id) return { valid: false, reason: "no_photo_upload" };

  const { data: photo } = await adminClient
    .from("photo_uploads")
    .select("id, storage_path, quality_status")
    .eq("id", job.photo_upload_id)
    .maybeSingle();

  if (!photo) return { valid: false, reason: "photo_not_found" };

  await adminClient
    .from("photo_uploads")
    .update({ quality_status: "accepted" })
    .eq("id", photo.id);

  return { valid: true };
};

const getPhotoPublicUrl = async (
  job: ClaimedAvatarJob,
  opts?: { squareCrop?: boolean },
): Promise<string | null> => {
  if (!job.photo_upload_id) return null;

  const { data: photo } = await adminClient
    .from("photo_uploads")
    .select("storage_path")
    .eq("id", job.photo_upload_id)
    .maybeSingle();

  if (!photo?.storage_path) return null;

  if (opts?.squareCrop) {
    const { data: transformed } = await adminClient.storage
      .from("face-raw-private")
      .createSignedUrl(photo.storage_path, 600, {
        transform: { width: 1024, height: 1024, resize: "cover" },
      });

    if (transformed?.signedUrl) {
      console.log("[Preprocess] Square-cropped URL via storage transform");
      return transformed.signedUrl;
    }
    console.warn("[Preprocess] Transform unavailable, falling back to original");
  }

  const { data: signedData } = await adminClient.storage
    .from("face-raw-private")
    .createSignedUrl(photo.storage_path, 600);

  return signedData?.signedUrl ?? null;
};

const AVATAR_PORTRAIT_PROMPT = [
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

const STARTER_HERO_PROMPT = [
  "Transform this pixel-art avatar character into a wide cinematic pixel-art hero scene.",
  "Keep the exact same character with identical face shape, hairstyle, hair color, facial features, glasses if present, and skin tone.",
  "Show the character in a calm, warm, minimal morning setting — soft golden-hour light filtering through a clean space.",
  "The character should be relaxed and at ease: sitting at a minimal desk, standing by a window, or in a cozy reading nook.",
  "Use a wide 16:9 composition with the character positioned using the rule of thirds, not dead center.",
  "Premium detailed pixel art style with warm muted earth tones, subtle dithering, and cozy nostalgic atmosphere.",
  "The scene should feel peaceful, personal, and inviting — like the beginning of a fresh productive day.",
  "No text, no UI elements, no hand gestures, no action poses, no clutter, no other people.",
  "No photorealism, no smooth gradients, no watermark.",
  "Ultra high quality pixel art illustration with rich depth and gentle ambient lighting.",
].join(" ");

const generateAvatar = async (job: ClaimedAvatarJob) => {
  console.log(`[Gen] Validating photo for job ${job.id}`);
  const validation = await validatePhoto(job);
  if (!validation.valid) {
    console.warn(`[Gen] Photo invalid: ${validation.reason}`);
    if (job.photo_upload_id) {
      await adminClient
        .from("photo_uploads")
        .update({
          quality_status: "reupload_required",
          validation_error: validation.reason,
        })
        .eq("id", job.photo_upload_id);

      await adminClient.from("notification_events").insert({
        user_id: job.user_id,
        event_key: "upload_clearer_photo_required",
        status: "queued",
        payload: { reason: validation.reason },
      });
    }
    await failJob(job, validation.reason ?? "photo_validation_failed");
    return { status: "failed", reason: "photo_invalid" };
  }

  console.log(`[Gen] Getting square-cropped photo URL for head-and-shoulders framing`);
  const sourcePhotoUrl = await getPhotoPublicUrl(job, { squareCrop: true });
  if (!sourcePhotoUrl) {
    await failJob(job, "could_not_get_photo_url");
    return { status: "failed", reason: "photo_url_missing" };
  }
  console.log(`[Gen] Photo URL obtained, length: ${sourcePhotoUrl.length}`);

  console.log(`[Gen] Submitting avatarPortrait generation via ${FAL_MODEL_EDIT}`);
  const falResult = await runFalAndWait(FAL_MODEL_EDIT, {
    prompt: AVATAR_PORTRAIT_PROMPT,
    image_urls: [sourcePhotoUrl],
    num_images: 1,
    aspect_ratio: "1:1",
    output_format: "png",
    resolution: "2K",
    thinking_level: "high",
  }, 180_000);

  if ("error" in falResult) {
    console.error(`[Gen] avatarPortrait generation failed: ${falResult.error}`);
    await failJob(job, falResult.error);
    return { status: "failed", reason: "avatar_portrait_generation_failed" };
  }

  const avatarImageUrl = falResult.imageUrl;

  console.log(`[Gen] Got avatar image URL, downloading...`);
  const imageResponse = await fetch(avatarImageUrl);
  if (!imageResponse.ok) {
    const errText = `image_download_failed_${imageResponse.status}`;
    console.error(`[Gen] ${errText}`);
    await failJob(job, errText);
    return { status: "failed", reason: errText };
  }

  const imageBlob = await imageResponse.blob();
  const imageBuffer = new Uint8Array(await imageBlob.arrayBuffer());
  const storagePath = `${job.user_id}/${job.id}_v1.jpg`;

  console.log(`[Gen] Uploading to avatars-private (${imageBuffer.length} bytes)`);
  const { error: storageError } = await adminClient.storage
    .from("avatars-private")
    .upload(storagePath, imageBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (storageError) {
    console.warn(`[Gen] Storage upload failed: ${storageError.message}, using direct URL`);
  }

  const finalUrl = storageError ? avatarImageUrl : storagePath;

  console.log(`[Gen] Inserting avatar record`);
  const { data: avatar, error: avatarError } = await adminClient
    .from("avatars")
    .insert({
      user_id: job.user_id,
      photo_upload_id: job.photo_upload_id,
      storage_path: storagePath,
      image_url: finalUrl,
      asset_type: "profile_avatar",
      style_version: "avatar-portrait-v1",
      model_version: FAL_MODEL_EDIT,
      is_active: true,
    })
    .select("id")
    .single();

  if (avatarError || !avatar) {
    console.error(`[Gen] Avatar insert failed: ${avatarError?.message}`);
    await failJob(job, avatarError?.message ?? "avatar_insert_failed");
    return { status: "failed", reason: "avatar_insert_failed" };
  }

  console.log(`[Gen] Avatar created: ${avatar.id}, finalizing`);

  await adminClient
    .from("avatars")
    .update({ is_active: false })
    .eq("user_id", job.user_id)
    .eq("asset_type", "profile_avatar")
    .neq("id", avatar.id);

  await adminClient.from("cost_ledger").insert({
    user_id: job.user_id,
    job_id: null,
    provider: "fal.ai",
    cost_usd: 0.122,
    image_count: 1,
    metadata: {
      avatarJobId: job.id,
      promptVersion: job.prompt_version,
      model: FAL_MODEL_EDIT,
      generationMode: "avatarPortrait",
    },
  });

  await logAudit(job.user_id, "avatar_generated", "avatar", avatar.id);

  // ── Generate starterHero using the avatar as reference ──
  let starterHeroId: string | null = null;

  console.log(`[Gen] Starting starterHero generation using avatar as input`);
  const avatarSignedUrl = avatarImageUrl;

  const starterResult = await runFalAndWait(FAL_MODEL_EDIT, {
    prompt: STARTER_HERO_PROMPT,
    image_urls: [avatarSignedUrl],
    num_images: 1,
    aspect_ratio: "16:9",
    output_format: "png",
    resolution: "2K",
    thinking_level: "high",
  }, 180_000);

  if ("error" in starterResult) {
    console.warn(`[Gen] starterHero generation failed (non-fatal): ${starterResult.error}`);
  } else {
    const starterImageUrl = starterResult.imageUrl;

    console.log(`[Gen] Got starterHero image URL, downloading...`);
    const starterResponse = await fetch(starterImageUrl);

    if (starterResponse.ok) {
      const starterBlob = await starterResponse.blob();
      const starterBuffer = new Uint8Array(await starterBlob.arrayBuffer());
      const starterPath = `${job.user_id}/${job.id}_starter_hero_v1.jpg`;

      console.log(`[Gen] Uploading starterHero to avatars-private (${starterBuffer.length} bytes)`);
      const { error: starterStorageError } = await adminClient.storage
        .from("avatars-private")
        .upload(starterPath, starterBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      const starterFinalUrl = starterStorageError ? starterImageUrl : starterPath;

      if (starterStorageError) {
        console.warn(`[Gen] starterHero storage upload failed: ${starterStorageError.message}, using direct URL`);
      }

      await adminClient
        .from("avatars")
        .update({ is_active: false })
        .eq("user_id", job.user_id)
        .eq("asset_type", "starter_hero");

      const { data: starterHero, error: starterInsertError } = await adminClient
        .from("avatars")
        .insert({
          user_id: job.user_id,
          photo_upload_id: job.photo_upload_id,
          storage_path: starterPath,
          image_url: starterFinalUrl,
          asset_type: "starter_hero",
          style_version: "starter-hero-v1",
          model_version: FAL_MODEL_EDIT,
          is_active: true,
        })
        .select("id")
        .single();

      if (starterInsertError || !starterHero) {
        console.warn(`[Gen] starterHero insert failed (non-fatal): ${starterInsertError?.message}`);
      } else {
        starterHeroId = starterHero.id;
        console.log(`[Gen] starterHero created: ${starterHero.id}`);

        await adminClient.from("cost_ledger").insert({
          user_id: job.user_id,
          job_id: null,
          provider: "fal.ai",
          cost_usd: 0.122,
          image_count: 1,
          metadata: {
            avatarJobId: job.id,
            promptVersion: job.prompt_version,
            model: FAL_MODEL_EDIT,
            generationMode: "starterHero",
          },
        });

        await logAudit(job.user_id, "starter_hero_generated", "avatar", starterHero.id);
      }
    } else {
      console.warn(`[Gen] starterHero image download failed (non-fatal): ${starterResponse.status}`);
    }
  }

  // ── Finalize job ──
  await adminClient
    .from("avatar_jobs")
    .update({
      status: "succeeded",
      avatar_id: avatar.id,
      attempt_count: job.attempt_count + 1,
      finished_at: new Date().toISOString(),
      locked_by: null,
      locked_until: null,
    })
    .eq("id", job.id);

  const userUpdate: Record<string, unknown> = {
    active_avatar_id: avatar.id,
    avatar_generation_status: "succeeded",
  };
  if (starterHeroId) {
    userUpdate.active_starter_hero_id = starterHeroId;
  }

  await adminClient
    .from("users")
    .update(userUpdate)
    .eq("id", job.user_id);

  await adminClient.from("notification_events").insert({
    user_id: job.user_id,
    event_key: "avatar_ready",
    status: "queued",
    payload: { jobId: job.id, avatarId: avatar.id, starterHeroId },
  });

  console.log(`[Gen] Job ${job.id} completed successfully (avatar: ${avatar.id}, starterHero: ${starterHeroId ?? "skipped"})`);
  return { status: "succeeded", avatarId: avatar.id, starterHeroId };
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
    await adminClient
      .from("avatar_jobs")
      .update({
        status: "pending",
        locked_by: null,
        locked_until: null,
      })
      .eq("status", "processing")
      .lt("updated_at", new Date(Date.now() - 3 * 60_000).toISOString());

    await adminClient
      .from("avatar_jobs")
      .update({
        status: "pending",
        locked_by: null,
        locked_until: null,
      })
      .eq("status", "leased")
      .lt("locked_until", new Date().toISOString());

    const { data: jobs, error: claimError } = await adminClient.rpc("claim_avatar_jobs", {
      worker_name: WORKER_NAME,
      max_jobs: limit,
    });

    if (claimError) {
      console.error("[Worker] claim error:", claimError.message);
      return serverError("avatar_job_claim_failed", claimError.message);
    }
    if (!jobs || jobs.length === 0) return json({ claimed: 0, processed: [] });

    const processed: Array<Record<string, unknown>> = [];

    for (const job of jobs as ClaimedAvatarJob[]) {
      try {
        await adminClient
          .from("avatar_jobs")
          .update({
            status: "processing",
            started_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        console.log(`[Worker] Processing job ${job.id} for user ${job.user_id}`);
        const result = await generateAvatar(job);
        console.log(`[Worker] Job ${job.id} result:`, JSON.stringify(result));
        processed.push({ jobId: job.id, ...result });
      } catch (jobError) {
        const errMsg = String(jobError);
        console.error(`[Worker] Job ${job.id} crashed:`, errMsg);

        await adminClient
          .from("avatar_jobs")
          .update({
            status: "pending",
            attempt_count: job.attempt_count + 1,
            last_error: errMsg.slice(0, 500),
            locked_by: null,
            locked_until: null,
            next_run_at: new Date(Date.now() + 30_000).toISOString(),
          })
          .eq("id", job.id);

        processed.push({ jobId: job.id, status: "crashed", error: errMsg });
      }
    }

    return json({ claimed: jobs.length, processed, worker: WORKER_NAME });
  } catch (error) {
    console.error("[Worker] Fatal error:", String(error));
    return serverError("avatar_worker_error", String(error));
  }
});
