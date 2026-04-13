import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { badRequest, corsHeaders, json, methodNotAllowed, serverError } from "../_shared/http.ts";

type TrackBody = {
  eventName: string;
  properties?: Record<string, unknown>;
  sessionId?: string;
  deviceInfo?: Record<string, unknown>;
};

const ALLOWED_EVENTS = [
  "onboarding_started",
  "onboarding_completed",
  "paywall_viewed",
  "paywall_plan_selected",
  "paywall_purchase_started",
  "paywall_purchase_completed",
  "paywall_purchase_failed",
  "paywall_purchase_cancelled",
  "paywall_dismissed",
  "paywall_restore_tapped",
  "paywall_restore_success",
  "paywall_restore_failed",
  "trial_started",
  "subscription_activated",
  "subscription_expired",
  "photo_upload_started",
  "photo_upload_completed",
  "photo_upload_failed",
  "avatar_generation_started",
  "avatar_generation_completed",
  "first_task_created",
  "third_task_created",
  "visual_eligible",
  "visual_queued",
  "visual_ready",
  "visual_viewed",
  "day_2_return",
  "app_opened",
  "tab_switched",
  "task_created",
  "task_completed",
  "habit_completed",
  "ai_assistant_opened",
  "ai_suggestion_accepted",
  "ai_suggestion_rejected",
  "profile_updated",
  "settings_changed",
  "push_permission_granted",
  "push_permission_denied",
];

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const { user, response } = await getUserFromRequest(request);
  if (response || !user) return response;

  let body: TrackBody;
  try {
    body = await request.json();
  } catch {
    return badRequest("invalid_json");
  }

  if (!body.eventName) return badRequest("event_name_required");

  if (!ALLOWED_EVENTS.includes(body.eventName)) {
    return badRequest("unknown_event", { allowed: ALLOWED_EVENTS });
  }

  try {
    await adminClient.from("analytics_events").insert({
      user_id: user.id,
      event_name: body.eventName,
      source: "frontend",
      properties: body.properties ?? {},
      session_id: body.sessionId ?? null,
      device_info: body.deviceInfo ?? null,
    });

    const PAYWALL_FUNNEL_EVENTS = [
      "paywall_viewed",
      "paywall_plan_selected",
      "paywall_purchase_started",
      "paywall_purchase_completed",
      "paywall_purchase_failed",
      "paywall_purchase_cancelled",
      "paywall_dismissed",
      "paywall_restore_tapped",
      "paywall_restore_success",
      "paywall_restore_failed",
      "trial_started",
      "subscription_activated",
    ];

    if (PAYWALL_FUNNEL_EVENTS.includes(body.eventName)) {
      await adminClient.from("paywall_events").insert({
        user_id: user.id,
        event_type: body.eventName,
        metadata: body.properties ?? {},
      });
    }

    return json({ tracked: true, eventName: body.eventName });
  } catch (error) {
    return serverError("track_event_error", String(error));
  }
});
