import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { getSubscription } from "../_shared/premium.ts";
import { corsHeaders, json, methodNotAllowed, serverError } from "../_shared/http.ts";

const MIN_COMPLETED_FOR_VISUAL = 3;

type EligibilityResult = {
  eligible: boolean;
  reason?: string;
  completedToday: number;
  minRequired: number;
  hasActiveAvatar: boolean;
  isPremium: boolean;
  hasTodayVisual: boolean;
  hasPendingJob: boolean;
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "GET" && request.method !== "POST") return methodNotAllowed();

  const { user, response } = await getUserFromRequest(request);
  if (response || !user) return response;

  try {
    const today = new Date().toISOString().slice(0, 10);
    const sub = await getSubscription(user.id);

    // Check active avatar
    const { data: avatar } = await adminClient
      .from("avatars")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    // Count today's completions
    const { count: completedCount } = await adminClient
      .from("task_completions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("completed_at", `${today}T00:00:00Z`)
      .lt("completed_at", `${today}T23:59:59Z`);

    // Check existing today visual
    const { data: todayVisual } = await adminClient
      .from("daily_visuals")
      .select("id")
      .eq("user_id", user.id)
      .eq("visual_date", today)
      .maybeSingle();

    // Check pending generation job
    const { data: pendingJob } = await adminClient
      .from("generation_jobs")
      .select("id")
      .eq("user_id", user.id)
      .eq("job_type", "daily_scene")
      .in("status", ["pending", "leased", "processing"])
      .maybeSingle();

    const completed = completedCount ?? 0;
    const hasActiveAvatar = !!avatar;
    const hasTodayVisual = !!todayVisual;
    const hasPendingJob = !!pendingJob;

    const result: EligibilityResult = {
      eligible: false,
      completedToday: completed,
      minRequired: MIN_COMPLETED_FOR_VISUAL,
      hasActiveAvatar,
      isPremium: sub.isPremium,
      hasTodayVisual,
      hasPendingJob,
    };

    if (!sub.isPremium) {
      result.reason = "premium_required";
    } else if (!hasActiveAvatar) {
      result.reason = "avatar_required";
    } else if (completed < MIN_COMPLETED_FOR_VISUAL) {
      result.reason = "insufficient_completions";
    } else if (hasTodayVisual) {
      result.reason = "already_generated_today";
    } else if (hasPendingJob) {
      result.reason = "generation_in_progress";
    } else {
      result.eligible = true;
    }

    return json(result);
  } catch (error) {
    return serverError("eligibility_check_error", String(error));
  }
});
