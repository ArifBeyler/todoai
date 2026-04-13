import { adminClient } from "./supabase.ts";

export type SubscriptionSnapshot = {
  status: string;
  isPremium: boolean;
  trialEndsAt: string | null;
  expiresAt: string | null;
};

const PREMIUM_STATUSES = ["trialing", "active", "grace"];

export const getSubscription = async (
  userId: string,
): Promise<SubscriptionSnapshot> => {
  const { data } = await adminClient
    .from("subscriptions")
    .select("status, trial_ends_at, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    return { status: "none", isPremium: false, trialEndsAt: null, expiresAt: null };
  }

  return {
    status: data.status,
    isPremium: PREMIUM_STATUSES.includes(data.status),
    trialEndsAt: data.trial_ends_at,
    expiresAt: data.expires_at,
  };
};

export const requirePremium = async (userId: string): Promise<SubscriptionSnapshot | null> => {
  const sub = await getSubscription(userId);
  if (!sub.isPremium) return null;
  return sub;
};
