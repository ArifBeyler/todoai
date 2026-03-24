import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { badRequest, corsHeaders, json, methodNotAllowed, serverError } from "../_shared/http.ts";

type JobType = "avatar" | "daily_scene" | "regenerate";
type RequestBody = {
  jobType?: JobType;
  todoIds?: string[];
  promptVersion?: string;
  metadata?: Record<string, unknown>;
};

const MIN_SCENE_TODOS = 4;

const normalizeTodoIds = (todoIds: unknown): string[] => {
  if (!Array.isArray(todoIds)) return [];
  return todoIds.filter((item): item is string => typeof item === "string" && item.length > 0);
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const { client, user, response } = await getUserFromRequest(request);
  if (response || !client || !user) return response;

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return badRequest("invalid_json");
  }

  const jobType = body.jobType ?? "daily_scene";
  if (!["avatar", "daily_scene", "regenerate"].includes(jobType)) {
    return badRequest("invalid_job_type");
  }

  const todoIds = normalizeTodoIds(body.todoIds);
  const idempotencyKey =
    request.headers.get("x-idempotency-key") ??
    `${user.id}:${jobType}:${new Date().toISOString().slice(0, 10)}`;

  try {
    if (jobType === "daily_scene") {
      const { data: todos, error: todoError } = await client
        .from("todos")
        .select("id, title")
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .in("id", todoIds.length > 0 ? todoIds : ["00000000-0000-0000-0000-000000000000"]);

      if (todoError) return serverError("todo_lookup_failed", todoError.message);

      if (todoIds.length > 0 && (todos?.length ?? 0) !== todoIds.length) {
        return badRequest("some_todos_not_owned_or_missing");
      }

      const selectedIds = todoIds.length > 0 ? todoIds : [];
      if (selectedIds.length > 0 && selectedIds.length < MIN_SCENE_TODOS) {
        return badRequest("insufficient_todos_for_daily_scene", { minRequired: MIN_SCENE_TODOS });
      }
    }

    const payload = {
      todo_ids: todoIds,
      metadata: body.metadata ?? {},
      requested_at: new Date().toISOString(),
    };

    const { data: insertedJob, error: insertError } = await client
      .from("generation_jobs")
      .insert({
        user_id: user.id,
        job_type: jobType,
        status: "pending",
        idempotency_key: idempotencyKey,
        prompt_version: body.promptVersion ?? "v1",
        source: "app",
        payload,
      })
      .select("id, status, created_at")
      .single();

    if (insertError) {
      if (String(insertError.message).includes("generation_jobs_idempotency_key_key")) {
        const { data: existing } = await client
          .from("generation_jobs")
          .select("id, status, created_at")
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();
        return json({ status: "already_queued", job: existing }, 200);
      }
      return serverError("job_insert_failed", insertError.message);
    }

    const eventKey = jobType === "avatar" ? "avatar_generation_started" : "daily_scene_generation_started";
    await client.from("notification_events").insert({
      user_id: user.id,
      event_key: eventKey,
      status: "queued",
      payload: { job_id: insertedJob.id, job_type: jobType },
    });

    return json({
      status: "queued",
      provider: "fal.ai",
      job: insertedJob,
      idempotencyKey,
    });
  } catch (error) {
    return serverError("unexpected_generate_error", String(error));
  }
});
