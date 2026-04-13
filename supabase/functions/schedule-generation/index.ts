import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient } from "../_shared/supabase.ts";
import { corsHeaders, json, methodNotAllowed, serverError, unauthorized } from "../_shared/http.ts";

const MIN_COMPLETED_FOR_DAILY_SCENE = 3;

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && request.headers.get("x-cron-secret") !== cronSecret) {
    return unauthorized();
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    // Find eligible users: premium + onboarding done + active avatar
    const { data: premiumUsers, error: usersError } = await adminClient
      .from("subscriptions")
      .select("user_id, status")
      .in("status", ["trialing", "active", "grace"]);

    if (usersError) return serverError("user_query_failed", usersError.message);

    let queued = 0;
    let skippedNoAvatar = 0;
    let skippedInsufficientCompletions = 0;
    let skippedExisting = 0;

    for (const sub of premiumUsers ?? []) {
      // Check active avatar
      const { data: avatar } = await adminClient
        .from("avatars")
        .select("id")
        .eq("user_id", sub.user_id)
        .eq("is_active", true)
        .maybeSingle();

      if (!avatar) {
        skippedNoAvatar += 1;
        continue;
      }

      // Check today's completed task count
      const { count: completedCount } = await adminClient
        .from("task_completions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", sub.user_id)
        .gte("completed_at", `${today}T00:00:00Z`)
        .lt("completed_at", `${today}T23:59:59Z`);

      if ((completedCount ?? 0) < MIN_COMPLETED_FOR_DAILY_SCENE) {
        skippedInsufficientCompletions += 1;
        await adminClient.from("notification_events").insert({
          user_id: sub.user_id,
          event_key: "add_more_todos_to_unlock_daily_visual",
          status: "queued",
          payload: {
            minRequired: MIN_COMPLETED_FOR_DAILY_SCENE,
            currentCount: completedCount ?? 0,
            targetDate: today,
          },
        });
        continue;
      }

      // Check existing daily visual
      const { data: existingVisual } = await adminClient
        .from("daily_visuals")
        .select("id")
        .eq("user_id", sub.user_id)
        .eq("visual_date", today)
        .maybeSingle();

      if (existingVisual) {
        skippedExisting += 1;
        continue;
      }

      // Idempotent job enqueue
      const idempotencyKey = `daily_scene:${sub.user_id}:${today}`;
      const { error: insertError } = await adminClient.from("generation_jobs").insert({
        user_id: sub.user_id,
        job_type: "daily_scene",
        status: "pending",
        idempotency_key: idempotencyKey,
        source: "scheduler",
        prompt_version: "v1",
        payload: { target_date: today, avatar_id: avatar.id },
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
        user_id: sub.user_id,
        event_key: "daily_visual_generation_scheduled",
        status: "queued",
        payload: { targetDate: today, idempotencyKey },
      });
    }

    return json({
      scheduled: true,
      date: today,
      queued,
      skippedNoAvatar,
      skippedInsufficientCompletions,
      skippedExisting,
    });
  } catch (error) {
    return serverError("unexpected_schedule_error", String(error));
  }
});
