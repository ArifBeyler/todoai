import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { corsHeaders, json, methodNotAllowed, serverError } from "../_shared/http.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "GET") return methodNotAllowed();

  const { user, response } = await getUserFromRequest(request);
  if (response || !user) return response;

  try {
    const { data: sub } = await adminClient
      .from("subscriptions")
      .select("status, product_id, trial_ends_at, expires_at, grace_until, entitlements")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub) {
      return json({
        status: "none",
        isPremium: false,
        productId: null,
        trialEndsAt: null,
        expiresAt: null,
      });
    }

    const premiumStatuses = ["trialing", "active", "grace"];
    let currentStatus = sub.status;

    if (sub.expires_at && premiumStatuses.includes(currentStatus)) {
      const expiresAt = new Date(sub.expires_at);
      const graceUntil = sub.grace_until ? new Date(sub.grace_until) : null;
      const now = new Date();

      if (now > expiresAt) {
        if (graceUntil && now <= graceUntil) {
          currentStatus = "grace";
        } else {
          currentStatus = "expired";

          await adminClient
            .from("subscriptions")
            .update({ status: "expired" })
            .eq("user_id", user.id);

          await adminClient
            .from("users")
            .update({ is_premium: false })
            .eq("id", user.id);
        }
      }
    }

    const isPremium = premiumStatuses.includes(currentStatus);

    return json({
      status: currentStatus,
      isPremium,
      productId: sub.product_id,
      trialEndsAt: sub.trial_ends_at,
      expiresAt: sub.expires_at,
    });
  } catch (error) {
    return serverError("verify_subscription_error", String(error));
  }
});
