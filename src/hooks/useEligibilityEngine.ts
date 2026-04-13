import { useMemo, useEffect } from "react";
import { useSessionStore } from "@state/useSessionStore";
import { useFTUEStore } from "@state/useFTUEStore";
import { useTodoStore, getEligibleTodos, hashEligibleTodos } from "@state/useTodoStore";
import { useAIVisualStore, type AIVisualState } from "@state/useAIVisualStore";

const STABILITY_WINDOW_MS = 4 * 60 * 60 * 1000;   // 4 hours
const ACTIVITY_GUARD_MS = 30 * 60 * 1000;          // 30 minutes
const MIN_ELIGIBLE_TODOS = 3;

const todayStr = () => new Date().toISOString().slice(0, 10);

type EligibilityResult = {
  aiVisualState: AIVisualState;
  eligibleTodoCount: number;
  eligibleTodoIds: string[];
  eligibleTodoHashes: string;
  isStable: boolean;
  hasRecentActivity: boolean;
  minutesUntilStable: number;
};

/**
 * Computes the canonical AI visual eligibility state by examining:
 * - Current eligible (active, non-deleted, non-empty-title) todo count
 * - Whether those todos have been stable for ≥4h
 * - Whether there was create/delete/edit activity in the last 30 min
 * - Premium status and profile readiness
 * - Daily visual cap (max 1 per local day)
 *
 * This is the single source of truth that drives heroVariant messaging.
 */
export const useEligibilityEngine = (): EligibilityResult => {
  const todos = useTodoStore((s) => s.todos);
  const { isPremium } = useSessionStore();
  const { avatarStatus, paywallInteraction } = useFTUEStore();
  const { state: currentAIState, dailyVisualDate, transitionTo } = useAIVisualStore();

  const isSubscribed = isPremium || paywallInteraction === "subscribed";
  const isProfileReady = avatarStatus === "ready";

  const eligibleTodos = useMemo(() => getEligibleTodos(todos), [todos]);
  const eligibleTodoCount = eligibleTodos.length;
  const eligibleTodoIds = useMemo(() => eligibleTodos.map((t) => t.id), [eligibleTodos]);
  const eligibleTodoHashes = useMemo(() => hashEligibleTodos(todos), [todos]);

  // Find the most recent activity timestamp across all eligible todos
  const lastActivityMs = useMemo(() => {
    if (eligibleTodos.length === 0) return 0;
    return Math.max(...eligibleTodos.map((t) => new Date(t.updatedAt).getTime()));
  }, [eligibleTodos]);

  const now = Date.now();
  const hasRecentActivity = lastActivityMs > 0 && now - lastActivityMs < ACTIVITY_GUARD_MS;
  const isStable = lastActivityMs > 0 && now - lastActivityMs >= STABILITY_WINDOW_MS;
  const minutesUntilStable = isStable
    ? 0
    : Math.ceil((STABILITY_WINDOW_MS - (now - lastActivityMs)) / 60_000);

  const hasGeneratedToday = dailyVisualDate === todayStr();

  // Derive the correct state
  const derivedState = useMemo((): AIVisualState => {
    // Once a job is generating/ready/failed don't override it — useHeroReveal manages those transitions
    if (
      currentAIState === "daily_visual_generating" ||
      currentAIState === "daily_visual_ready" ||
      currentAIState === "daily_visual_failed" ||
      currentAIState === "daily_visual_queued" ||
      currentAIState === "profile_generating"
    ) {
      return currentAIState;
    }

    if (eligibleTodoCount < MIN_ELIGIBLE_TODOS) return "not_eligible";

    if (hasRecentActivity || !isStable) return "waiting_for_stability";

    if (!isSubscribed) return "eligible_paywall_locked";

    if (!isProfileReady) return "eligible_needs_profile";

    // Profile ready + premium + stable todos + haven't generated today
    if (!hasGeneratedToday) return "daily_visual_queued";

    // Already generated today — stay in current state (ready or other)
    return currentAIState;
  }, [
    currentAIState,
    eligibleTodoCount,
    hasRecentActivity,
    isStable,
    isSubscribed,
    isProfileReady,
    hasGeneratedToday,
  ]);

  // Sync derived state to store (only when it actually changes)
  useEffect(() => {
    if (derivedState !== currentAIState) {
      transitionTo(derivedState);
    }
  }, [derivedState, currentAIState, transitionTo]);

  return {
    aiVisualState: derivedState,
    eligibleTodoCount,
    eligibleTodoIds,
    eligibleTodoHashes,
    isStable,
    hasRecentActivity,
    minutesUntilStable,
  };
};
