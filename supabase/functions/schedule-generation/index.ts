import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient } from "../_shared/supabase.ts";
import { corsHeaders, json, methodNotAllowed, serverError, unauthorized } from "../_shared/http.ts";

const MIN_TODOS_FOR_DAILY_SCENE = 4;

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && request.headers.get("x-cron-secret") !== cronSecret) {
    return unauthorized();
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    const { data: users, error: usersError } = await adminClient
      .from("users")
      .select("id, is_premium, onboarding_completed, avatar_generation_status")
      .eq("is_premium", true)
      .eq("onboarding_completed", true)
      .eq("avatar_generation_status", "succeeded");

    if (usersError) return serverError("user_query_failed", usersError.message);

    let queued = 0;
    let skippedInsufficientTodos = 0;
    let skippedExisting = 0;

    for (const user of users ?? []) {
      const { count: todoCount, error: todoError } = await adminClient
        .from("todos")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_completed", false);

      if (todoError) continue;
      if ((todoCount ?? 0) < MIN_TODOS_FOR_DAILY_SCENE) {
        skippedInsufficientTodos += 1;
        await adminClient.from("notification_events").insert({
          user_id: user.id,
          event_key: "add_more_todos_to_unlock_daily_visual",
          status: "queued",
          payload: {
            minRequired: MIN_TODOS_FOR_DAILY_SCENE,
            currentCount: todoCount ?? 0,
            targetDate: today,
          },
        });
        continue;
      }

      const idempotencyKey = `daily_scene:${user.id}:${today}`;
      const { error: insertError } = await adminClient.from("generation_jobs").insert({
        user_id: user.id,
        job_type: "daily_scene",
        status: "pending",
        idempotency_key: idempotencyKey,
        source: "scheduler",
        prompt_version: "v1",
        payload: { target_date: today },
      });

      if (insertError) {
        if (String(insertError.message).includes("generation_jobs_idempotency_key_key")) {
          skippedExisting += 1;
          continue;
        }
        continue;
      }

      queued += 1;
      await adminClient.from("notification_events").insert({
        user_id: user.id,
        event_key: "daily_visual_generation_scheduled",
        status: "queued",
        payload: { targetDate: today, idempotencyKey },
      });
    }

    return json({
      scheduled: true,
      date: today,
      queued,
      skippedInsufficientTodos,
      skippedExisting,
    });
  } catch (error) {
    return serverError("unexpected_schedule_error", String(error));
  }
});
