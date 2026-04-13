import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, json, badRequest, methodNotAllowed, serverError } from "../_shared/http.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { trackBackendEvent } from "../_shared/analytics.ts";

const ALLOWED_FIELDS = new Set([
  "reminder_default_time",
  "quiet_hours_start",
  "quiet_hours_end",
  "active_hours_start",
  "active_hours_end",
  "notification_categories",
  "voice_enabled",
  "mic_permission_status",
  "haptics_enabled",
  "focus_sound_enabled",
  "daily_notification_limit",
  "suggestion_frequency_days",
  "preferred_generation_time",
  "prompt_style",
  "theme",
  "language",
]);

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const { user, response: authError } = await getUserFromRequest(request);
  if (authError) return authError;
  if (!user) return json({ error: "unauthorized" }, 401);

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key)) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return badRequest("No valid fields to update");
    }

    const { data: existing } = await adminClient
      .from("user_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await adminClient
        .from("user_preferences")
        .update(updates)
        .eq("user_id", user.id);

      if (error) return serverError("update_failed", error.message);
    } else {
      const { error } = await adminClient
        .from("user_preferences")
        .insert({ user_id: user.id, ...updates });

      if (error) return serverError("insert_failed", error.message);
    }

    await trackBackendEvent(user.id, "preferences_updated", {
      fields: Object.keys(updates),
    });

    return json({ status: "updated", fields: Object.keys(updates) });
  } catch (err) {
    return serverError("update_preferences_failed", String(err));
  }
});
