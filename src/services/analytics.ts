import { supabase } from "./supabase";

export const trackEvent = async (
  eventName: string,
  properties?: Record<string, unknown>,
) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/track-event`;

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ eventName, properties }),
    });
  } catch {
    // analytics should never block UI
  }
};
