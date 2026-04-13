import { adminClient } from "./supabase.ts";

export const trackBackendEvent = async (
  userId: string | null,
  eventName: string,
  properties?: Record<string, unknown>,
) => {
  await adminClient.from("analytics_events").insert({
    user_id: userId,
    event_name: eventName,
    source: "backend",
    properties: properties ?? {},
  });
};
