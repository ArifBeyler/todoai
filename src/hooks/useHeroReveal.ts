import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSessionStore } from "@state/useSessionStore";
import { useFTUEStore } from "@state/useFTUEStore";
import {
  useHeroRevealStore,
  type DailyHeroStatus,
} from "@state/useHeroRevealStore";
import {
  useTodoStore,
  MIN_TODOS_FOR_GENERATION,
  getEligibleTodos,
  hashEligibleTodos,
} from "@state/useTodoStore";
import {
  useAIVisualStore,
  canDeliverVisualNotification,
} from "@state/useAIVisualStore";
import { supabase } from "@/src/services/supabase";

export const MAX_BLUR = 25;

const todayStr = () => new Date().toISOString().slice(0, 10);

export const useHeroReveal = () => {
  const {
    dailyHeroStatus,
    dailyHeroDate,
    snapshotTodoIds,
    snapshotTodoCount,
    dailyHeroImageUrl,
    dailyHeroError,
    generatedAt,
    startGeneration,
    setHeroReady,
    setHeroError,
    retryGeneration,
    resetDailyHero,
  } = useHeroRevealStore();

  const todos = useTodoStore((s) => s.todos);
  const { isPremium, profilePhoto, stylePreference } = useSessionStore();
  const { avatarStatus, paywallInteraction, markFirstVisualDelivered } = useFTUEStore();

  const {
    state: aiVisualState,
    snapshotTodoHashes,
    setDailyVisualReady,
    markJobStale,
    profileGenerationState,
  } = useAIVisualStore();

  const isSubscribed = isPremium || paywallInteraction === "subscribed";
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Always points to the latest pollForHeroImage — prevents stale closure in setInterval
  const pollFnRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const completedSnapshotCount = useMemo(() => {
    if (snapshotTodoIds.length === 0) return 0;
    const snapshotSet = new Set(snapshotTodoIds);
    return todos.filter((t) => snapshotSet.has(t.id) && t.isCompleted).length;
  }, [todos, snapshotTodoIds]);

  const revealProgress =
    snapshotTodoCount > 0 ? completedSnapshotCount / snapshotTodoCount : 0;

  const blurAmount = MAX_BLUR * (1 - revealProgress);

  const isFullyRevealed = revealProgress >= 1;

  const progressText = `${completedSnapshotCount}/${snapshotTodoCount}`;

  const today = todayStr();
  const hasGeneratedToday =
    dailyHeroDate === today &&
    dailyHeroStatus !== "idle" &&
    dailyHeroStatus !== "failed";

  const eligibleTodos = useMemo(() => getEligibleTodos(todos), [todos]);
  const activeTodoCount = eligibleTodos.length;

  const canShowGenerationCTA =
    !hasGeneratedToday &&
    activeTodoCount >= MIN_TODOS_FOR_GENERATION &&
    (dailyHeroStatus === "idle" ||
      (dailyHeroDate !== today && dailyHeroStatus !== "generating")) &&
    isSubscribed &&
    !!profilePhoto &&
    avatarStatus === "ready";

  const isSnapshotTodo = useCallback(
    (todoId: string): boolean => snapshotTodoIds.includes(todoId),
    [snapshotTodoIds],
  );

  const effectiveDailyHeroStatus: DailyHeroStatus = useMemo(() => {
    if (
      dailyHeroStatus === "locked_reveal" ||
      dailyHeroStatus === "fully_revealed"
    ) {
      return isFullyRevealed ? "fully_revealed" : "locked_reveal";
    }
    return dailyHeroStatus;
  }, [dailyHeroStatus, isFullyRevealed]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollForHeroImage = useCallback(async () => {
    // Stale-job guard: if the eligible todo composition changed since the job started,
    // the generated visual no longer reflects the user's actual todos. Mark stale silently.
    const currentHash = hashEligibleTodos(todos);
    if (snapshotTodoHashes && snapshotTodoHashes !== currentHash) {
      markJobStale();
      setHeroError("Görevler değişti, görsel geçersiz sayıldı.");
      stopPolling();
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "get-home-state",
        { body: {} },
      );
      if (error || !data) return;

      const heroUrl =
        data.hero?.signedVisualUrl ?? data.hero?.activeVisualUrl ?? null;

      if (heroUrl) {
        setHeroReady(heroUrl);

        // Update AI visual store with the ready state
        setDailyVisualReady(heroUrl);

        // Notification delivery guard — all conditions must pass
        const canNotify = canDeliverVisualNotification({
          state: "daily_visual_ready",
          imageUrl: heroUrl,
          isPremium: isSubscribed,
          profileGenerationState,
          currentTodoHashes: currentHash,
          snapshotTodoHashes: snapshotTodoHashes,
        });

        if (canNotify) {
          markFirstVisualDelivered();
        }

        stopPolling();
      }
    } catch {
      // Silent — keep polling
    }
  }, [
    todos,
    snapshotTodoHashes,
    setHeroReady,
    setDailyVisualReady,
    markJobStale,
    setHeroError,
    stopPolling,
    isSubscribed,
    profileGenerationState,
    markFirstVisualDelivered,
  ]);

  // Keep the ref current so the interval always calls the latest version
  useEffect(() => {
    pollFnRef.current = pollForHeroImage;
  }, [pollForHeroImage]);

  const handleGenerateCTA = useCallback(async () => {
    const activeTodos = getEligibleTodos(todos);
    const todoIds = activeTodos.map((t) => t.id);

    if (todoIds.length < MIN_TODOS_FOR_GENERATION) return;
    if (hasGeneratedToday) return;
    if (!isSubscribed || !profilePhoto) return;

    startGeneration(todoIds);

    try {
      const snapshotTitles = activeTodos.map((t) => t.title);

      await supabase.functions.invoke("enqueue-daily-visual", {
        body: {
          todoTitles: snapshotTitles,
          style: stylePreference,
        },
      });

      // Use pollFnRef so interval always invokes the latest closure, never a stale one
      pollingRef.current = setInterval(() => pollFnRef.current(), 5_000);
      setTimeout(() => pollFnRef.current(), 2_000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Görsel oluşturulamadı";
      setHeroError(message);
    }
  }, [
    todos,
    hasGeneratedToday,
    isSubscribed,
    profilePhoto,
    stylePreference,
    startGeneration,
    setHeroError,
    pollForHeroImage,
  ]);

  const handleRetryGeneration = useCallback(async () => {
    if (dailyHeroStatus !== "failed") return;

    retryGeneration();

    try {
      const snapshotTodos = getEligibleTodos(todos).filter((t) =>
        snapshotTodoIds.includes(t.id),
      );
      const snapshotTitles = snapshotTodos.map((t) => t.title);

      await supabase.functions.invoke("enqueue-daily-visual", {
        body: {
          todoTitles: snapshotTitles,
          style: stylePreference,
        },
      });

      // Use pollFnRef so interval always invokes the latest closure, never a stale one
      pollingRef.current = setInterval(() => pollFnRef.current(), 5_000);
      setTimeout(() => pollFnRef.current(), 2_000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Görsel oluşturulamadı";
      setHeroError(message);
    }
  }, [
    dailyHeroStatus,
    snapshotTodoIds,
    todos,
    stylePreference,
    retryGeneration,
    setHeroError,
    pollForHeroImage,
  ]);

  const checkDailyReset = useCallback(() => {
    if (dailyHeroDate && dailyHeroDate !== today) {
      stopPolling();
      resetDailyHero();
    }
  }, [dailyHeroDate, today, stopPolling, resetDailyHero]);

  return {
    dailyHeroStatus: effectiveDailyHeroStatus,
    dailyHeroImageUrl,
    dailyHeroError,
    generatedAt,
    snapshotTodoIds,
    snapshotTodoCount,
    completedSnapshotCount,
    revealProgress,
    blurAmount,
    isFullyRevealed,
    progressText,
    hasGeneratedToday,
    canShowGenerationCTA,
    isSnapshotTodo,
    handleGenerateCTA,
    handleRetryGeneration,
    checkDailyReset,
    stopPolling,
  };
};
