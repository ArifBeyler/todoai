import { useCallback, useRef } from "react";
import { router } from "expo-router";
import { useFTUEStore, isPaywallOnCooldown } from "@state/useFTUEStore";
import { useSessionStore } from "@state/useSessionStore";
import { useTodoStore } from "@state/useTodoStore";

const TASK_THRESHOLD = 3;
const MAX_PASSIVE_SHOWS_PER_SESSION = 1;

export const usePaywallTrigger = () => {
  const passiveShowCount = useRef(0);

  const isPremium = useSessionStore((s) => s.isPremium);
  const {
    paywallInteraction,
    paywallDismissedAt,
    paywallShowCount,
    showPaywall,
    dismissPaywall,
  } = useFTUEStore();
  const activeTodoCount = useTodoStore(
    (s) => s.todos.filter((t) => !t.isCompleted).length,
  );

  const isSubscribed = isPremium || paywallInteraction === "subscribed";
  const onCooldown = isPaywallOnCooldown(paywallDismissedAt);

  const canShowPaywall = !isSubscribed && !onCooldown;

  const shouldAutoTrigger =
    canShowPaywall &&
    activeTodoCount >= TASK_THRESHOLD &&
    paywallShowCount === 0;

  const triggerPaywall = useCallback(() => {
    if (isSubscribed) return false;

    showPaywall();
    router.push("/paywall");
    return true;
  }, [isSubscribed, showPaywall]);

  const triggerPaywallIfEligible = useCallback(() => {
    if (!canShowPaywall) return false;
    if (activeTodoCount < TASK_THRESHOLD) return false;

    return triggerPaywall();
  }, [canShowPaywall, activeTodoCount, triggerPaywall]);

  const triggerPassivePaywall = useCallback(() => {
    if (!canShowPaywall) return false;
    if (passiveShowCount.current >= MAX_PASSIVE_SHOWS_PER_SESSION) return false;

    passiveShowCount.current += 1;
    return triggerPaywall();
  }, [canShowPaywall, triggerPaywall]);

  const handlePaywallDismiss = useCallback(() => {
    dismissPaywall();
  }, [dismissPaywall]);

  return {
    canShowPaywall,
    shouldAutoTrigger,
    isSubscribed,
    onCooldown,
    paywallShowCount,
    triggerPaywall,
    triggerPaywallIfEligible,
    triggerPassivePaywall,
    handlePaywallDismiss,
  };
};
