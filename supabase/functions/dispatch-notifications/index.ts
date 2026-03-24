import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient } from "../_shared/supabase.ts";
import { corsHeaders, json, methodNotAllowed, serverError, unauthorized } from "../_shared/http.ts";

const WORKER_SECRET = Deno.env.get("WORKER_SECRET");

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();
  if (WORKER_SECRET && request.headers.get("x-worker-secret") !== WORKER_SECRET) return unauthorized();

  try {
    const { data: events, error } = await adminClient
      .from("notification_events")
      .select("id, user_id, event_key, status, payload")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) return serverError("notification_fetch_failed", error.message);
    if (!events || events.length === 0) return json({ dispatched: 0 });

    // Production'da burada APNs/Firebase ile gerçek gönderim yapılmalı.
    for (const event of events) {
      await adminClient
        .from("notification_events")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", event.id);
    }

    return json({ dispatched: events.length });
  } catch (err) {
    return serverError("notification_dispatch_failed", String(err));
  }
});
