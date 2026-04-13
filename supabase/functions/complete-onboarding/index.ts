import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { logAudit } from "../_shared/audit.ts";
import { badRequest, corsHeaders, json, methodNotAllowed, serverError } from "../_shared/http.ts";

type OnboardingBody = {
  steps?: Array<{ key: string; status: string }>;
  displayName?: string;
  timezone?: string;
  stylePreference?: string;
  generationFrequency?: string;
  notificationOptIn?: boolean;
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const { user, response } = await getUserFromRequest(request);
  if (response || !user) return response;

  let body: OnboardingBody;
  try {
    body = await request.json();
  } catch {
    return badRequest("invalid_json");
  }

  try {
    // Upsert onboarding progress steps
    if (body.steps && body.steps.length > 0) {
      for (const step of body.steps) {
        await adminClient.from("onboarding_progress").upsert(
          {
            user_id: user.id,
            step_key: step.key,
            status: step.status === "completed" ? "completed" : "in_progress",
            completed_at: step.status === "completed" ? new Date().toISOString() : null,
          },
          { onConflict: "user_id,step_key" },
        );
      }
    }

    // Update user profile
    const profileUpdate: Record<string, unknown> = {
      onboarding_completed: true,
      onboarding_status: "completed",
      onboarding_completed_at: new Date().toISOString(),
    };

    if (body.displayName) profileUpdate.display_name = body.displayName;
    if (body.timezone) profileUpdate.timezone = body.timezone;
    if (body.stylePreference) profileUpdate.style_preference = body.stylePreference;
    if (body.generationFrequency) profileUpdate.generation_frequency = body.generationFrequency;
    if (body.notificationOptIn !== undefined) profileUpdate.notification_opt_in = body.notificationOptIn;

    await adminClient.from("users").update(profileUpdate).eq("id", user.id);

    // Create default user_preferences row
    await adminClient.from("user_preferences").upsert(
      {
        user_id: user.id,
        language: "tr",
      },
      { onConflict: "user_id" },
    );

    await logAudit(user.id, "onboarding_completed", "user", user.id);

    return json({ status: "completed" });
  } catch (error) {
    return serverError("onboarding_failed", String(error));
  }
});
