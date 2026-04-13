import { useCallback, useMemo, useRef } from "react";
import { useSessionStore } from "@state/useSessionStore";
import { useFTUEStore } from "@state/useFTUEStore";
import {
  useHeroRevealStore,
  type DailyHeroStatus,
} from "@state/useHeroRevealStore";
import {
  useTodoStore,
  MIN_TODOS_FOR_GENERATION,
} from "@state/useTodoStore";
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
  const avatarStatus = useFTUEStore((s) => s.avatarStatus);
  const paywallInteraction = useFTUEStore((s) => s.paywallInteraction);

  const isSubscribed = isPremium || paywallInteraction === "subscribed";
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const activeTodoCount = todos.filter((t) => !t.isCompleted).length;

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
        stopPolling();
      }
    } catch {
      // Silent — keep polling
    }
  }, [setHeroReady, stopPolling]);

  const handleGenerateCTA = useCallback(async () => {
    const activeTodos = todos.filter((t) => !t.isCompleted);
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

      pollingRef.current = setInterval(pollForHeroImage, 5_000);
      setTimeout(pollForHeroImage, 2_000);
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
      const snapshotTodos = todos.filter((t) =>
        snapshotTodoIds.includes(t.id),
      );
      const snapshotTitles = snapshotTodos.map((t) => t.title);

      await supabase.functions.invoke("enqueue-daily-visual", {
        body: {
          todoTitles: snapshotTitles,
          style: stylePreference,
        },
      });

      pollingRef.current = setInterval(pollForHeroImage, 5_000);
      setTimeout(pollForHeroImage, 2_000);
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
