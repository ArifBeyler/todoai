import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { requirePremium } from "../_shared/premium.ts";
import { logAudit } from "../_shared/audit.ts";
import { badRequest, corsHeaders, json, methodNotAllowed, serverError } from "../_shared/http.ts";

type JobType = "todo_scene" | "hero_portrait";

const DAILY_CAP = 5;

const enqueueTodoScene = async (
  userId: string,
  avatarId: string,
  avatarStyle: string,
  todoId: string,
  todoTitle: string,
  today: string,
) => {
  const idempotencyKey = `todo_visual:${userId}:${todoId}`;

  const { data: existingJob } = await adminClient
    .from("generation_jobs")
    .select("id, status, visual_id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingJob) {
    if (existingJob.status === "succeeded" && existingJob.visual_id) {
      const { data: visual } = await adminClient
        .from("generated_visuals")
        .select("image_url")
        .eq("id", existingJob.visual_id)
        .maybeSingle();

      if (visual?.image_url) {
        return json({
          status: "already_exists",
          jobId: existingJob.id,
          imageUrl: visual.image_url,
        });
      }
    }
    return json({ status: "already_queued", job: existingJob });
  }

  const { data: job, error: jobError } = await adminClient
    .from("generation_jobs")
    .insert({
      user_id: userId,
      job_type: "todo_scene" as const,
      status: "pending",
      idempotency_key: idempotencyKey,
      source: "app",
      prompt_version: "v2",
      payload: {
        todo_id: todoId,
        todo_title: todoTitle,
        target_date: today,
        avatar_id: avatarId,
        avatar_style: avatarStyle,
      },
    })
    .select("id, status, created_at")
    .single();

  if (jobError) {
    if (String(jobError.message).includes("generation_jobs_idempotency_key_key")) {
      const { data: existing } = await adminClient
        .from("generation_jobs")
        .select("id, status")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      return json({ status: "already_queued", job: existing });
    }
    return serverError("job_enqueue_failed", jobError.message);
  }

  await adminClient.from("notification_events").insert({
    user_id: userId,
    event_key: "todo_visual_generation_scheduled",
    status: "queued",
    payload: { jobId: job.id, todoId, todoTitle, targetDate: today },
  });

  await logAudit(userId, "todo_visual_enqueued", "generation_job", job.id);

  return json({ status: "queued", job, jobId: job.id });
};

const enqueueHeroPortrait = async (
  userId: string,
  avatarId: string,
  avatarStyle: string,
  today: string,
) => {
  const idempotencyKey = `hero_portrait:${userId}:${today}`;

  const { data: existingJob } = await adminClient
    .from("generation_jobs")
    .select("id, status, visual_id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingJob) {
    if (existingJob.status === "succeeded" && existingJob.visual_id) {
      const { data: visual } = await adminClient
        .from("generated_visuals")
        .select("image_url")
        .eq("id", existingJob.visual_id)
        .maybeSingle();

      if (visual?.image_url) {
        return json({
          status: "already_exists",
          jobId: existingJob.id,
          imageUrl: visual.image_url,
        });
      }
    }
    return json({ status: "already_queued", job: existingJob });
  }

  const { data: job, error: jobError } = await adminClient
    .from("generation_jobs")
    .insert({
      user_id: userId,
      job_type: "hero_portrait" as const,
      status: "pending",
      idempotency_key: idempotencyKey,
      source: "app",
      prompt_version: "v1",
      payload: {
        target_date: today,
        avatar_id: avatarId,
        avatar_style: avatarStyle,
      },
    })
    .select("id, status, created_at")
    .single();

  if (jobError) {
    if (String(jobError.message).includes("generation_jobs_idempotency_key_key")) {
      const { data: existing } = await adminClient
        .from("generation_jobs")
        .select("id, status")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      return json({ status: "already_queued", job: existing });
    }
    return serverError("job_enqueue_failed", jobError.message);
  }

  await adminClient.from("notification_events").insert({
    user_id: userId,
    event_key: "hero_portrait_generation_scheduled",
    status: "queued",
    payload: { jobId: job.id, targetDate: today },
  });

  await logAudit(userId, "hero_portrait_enqueued", "generation_job", job.id);

  return json({ status: "queued", job, jobId: job.id });
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const { user, response } = await getUserFromRequest(request);
  if (response || !user) return response;

  const sub = await requirePremium(user.id);
  if (!sub) return json({ error: "premium_required" }, 403);

  const today = new Date().toISOString().slice(0, 10);

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return badRequest("invalid_json");
  }

  const jobType = (body.jobType as JobType | undefined) ?? "todo_scene";
  const todoId = body.todoId as string | undefined;
  const todoTitle = body.todoTitle as string | undefined;

  if (jobType === "todo_scene" && (!todoId || !todoTitle)) {
    return badRequest("todoId and todoTitle are required for todo_scene");
  }

  try {
    const { data: avatar } = await adminClient
      .from("avatars")
      .select("id, image_url, style_version")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!avatar) return json({ error: "avatar_required" }, 400);

    const { count: todayJobCount } = await adminClient
      .from("generation_jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00Z`)
      .lt("created_at", `${today}T23:59:59Z`);

    if ((todayJobCount ?? 0) >= DAILY_CAP) {
      return json({
        status: "daily_cap_reached",
        todayCount: todayJobCount,
        cap: DAILY_CAP,
      });
    }

    if (jobType === "hero_portrait") {
      return await enqueueHeroPortrait(user.id, avatar.id, avatar.style_version, today);
    }

    return await enqueueTodoScene(
      user.id,
      avatar.id,
      avatar.style_version,
      todoId!,
      todoTitle!,
      today,
    );
  } catch (error) {
    return serverError("enqueue_visual_error", String(error));
  }
});
