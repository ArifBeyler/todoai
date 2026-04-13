import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient } from "../_shared/supabase.ts";
import { badRequest, corsHeaders, json, methodNotAllowed, serverError, unauthorized } from "../_shared/http.ts";
import { logAudit } from "../_shared/audit.ts";
import { trackBackendEvent } from "../_shared/analytics.ts";

type RCEvent = {
  id?: string;
  type?: string;
  app_user_id?: string;
  product_id?: string;
  entitlement_id?: string;
  purchased_at_ms?: number;
  expiration_at_ms?: number;
  event_timestamp_ms?: number;
  store?: string;
  environment?: string;
  is_trial_conversion?: boolean;
  cancel_reason?: string;
  grace_period_expiration_at_ms?: number;
};

type RCWebhookPayload = {
  api_version?: string;
  event?: RCEvent;
};

const STALE_EVENT_THRESHOLD_MS = 10 * 60 * 1000;

const mapEventToStatus = (eventType: string): string => {
  const mapping: Record<string, string> = {
    INITIAL_PURCHASE: "active",
    RENEWAL: "active",
    PRODUCT_CHANGE: "active",
    UNCANCELLATION: "active",
    NON_RENEWING_PURCHASE: "active",
    TRIAL_STARTED: "trialing",
    TRIAL_CONVERTED: "active",
    TRIAL_CANCELLED: "cancelled",
    CANCELLATION: "cancelled",
    EXPIRATION: "expired",
    BILLING_ISSUE_DETECTED: "past_due",
    SUBSCRIBER_ALIAS: "unknown",
  };
  return mapping[eventType] ?? "unknown";
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  const authHeader = request.headers.get("Authorization");
  if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
    return unauthorized();
  }

  let payload: RCWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return badRequest("invalid_json");
  }

  const event = payload.event;
  if (!event || !event.id || !event.type || !event.app_user_id) {
    return badRequest("missing_event_fields");
  }

  const appEnv = Deno.env.get("ENVIRONMENT") ?? "development";
  if (appEnv === "production" && event.environment === "SANDBOX") {
    return json({ accepted: false, reason: "sandbox_event_in_production" });
  }

  if (event.event_timestamp_ms) {
    const age = Date.now() - event.event_timestamp_ms;
    if (age > STALE_EVENT_THRESHOLD_MS) {
      return json({ accepted: false, reason: "stale_event", age_ms: age });
    }
  }

  try {
    const { error: eventInsertError } = await adminClient
      .from("subscription_events")
      .insert({
        user_id: event.app_user_id,
        rc_event_id: event.id,
        event_type: event.type,
        product_id: event.product_id,
        payload: event,
      });

    if (eventInsertError) {
      if (String(eventInsertError.message).includes("subscription_events_rc_event_id_key")) {
        return json({ accepted: true, duplicate: true });
      }
      return serverError("event_insert_failed", eventInsertError.message);
    }

    const newStatus = mapEventToStatus(event.type);
    const expiresAt = event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null;
    const graceUntil = event.grace_period_expiration_at_ms
      ? new Date(event.grace_period_expiration_at_ms).toISOString()
      : null;

    const subscriptionData = {
      user_id: event.app_user_id,
      status: newStatus,
      product_id: event.product_id ?? null,
      revenuecat_app_user_id: event.app_user_id,
      original_purchase_date: event.purchased_at_ms
        ? new Date(event.purchased_at_ms).toISOString()
        : null,
      trial_ends_at: event.type === "TRIAL_STARTED" ? expiresAt : undefined,
      expires_at: expiresAt,
      grace_until: graceUntil,
      cancellation_date: event.cancel_reason ? new Date().toISOString() : null,
      entitlements: event.entitlement_id
        ? { [event.entitlement_id]: true }
        : {},
    };

    const { error: upsertError } = await adminClient
      .from("subscriptions")
      .upsert(subscriptionData, { onConflict: "user_id" });

    if (upsertError) {
      return serverError("subscription_upsert_failed", upsertError.message);
    }

    const isPremium = ["trialing", "active", "grace"].includes(newStatus);
    await adminClient
      .from("users")
      .update({ is_premium: isPremium })
      .eq("id", event.app_user_id);

    await logAudit(
      event.app_user_id,
      `subscription_${event.type.toLowerCase()}`,
      "subscription",
      undefined,
      { eventType: event.type, productId: event.product_id, newStatus, environment: event.environment },
    );

    await trackBackendEvent(
      event.app_user_id,
      `rc_${event.type.toLowerCase()}`,
      { productId: event.product_id, newStatus },
    );

    return json({ accepted: true, status: newStatus });
  } catch (error) {
    return serverError("webhook_process_failed", String(error));
  }
});
