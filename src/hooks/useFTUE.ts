import { useCallback, useMemo } from "react";
import { useSessionStore } from "@state/useSessionStore";
import {
  useFTUEStore,
  isPaywallOnCooldown,
  TASK_MILESTONE_THRESHOLD,
} from "@state/useFTUEStore";
import { useHeroRevealStore } from "@state/useHeroRevealStore";
import { useTodoStore, getCurrentHeroTodo } from "@state/useTodoStore";

export type UserState =
  | "new_user"
  | "onboarded_unsubscribed"
  | "subscribed_no_photo"
  | "photo_uploaded_processing"
  | "photo_ready"
  | "paywall_dismissed"
  | "skipped_photo";

export type HomeHeroVariant =
  | "empty"
  | "need_more_todos"
  | "starter_hero"
  | "todo_visual"
  | "todo_generating"
  | "all_done"
  | "placeholder"
  | "premium_teaser"
  | "upload_prompt"
  | "processing"
  | "locked_reveal"
  | "fully_revealed";

export type TaskMilestoneStatus =
  | "no_tasks"
  | "in_progress"
  | "milestone_reached"
  | "generation_eligible";

export const useFTUE = () => {
  const {
    onboardingSlidesCompleted,
    accountGateCompleted,
    isGuestUser,
    photoUploadStatus,
    avatarStatus,
    paywallInteraction,
    notificationPermission,
    generationEligibility,
    paywallDismissedAt,
    photoValueSheetShown,
    firstVisualDelivered,
    taskCountAtLastCheck,
  } = useFTUEStore();

  const { isPremium, profilePhoto } = useSessionStore();
  const todos = useTodoStore((s) => s.todos);
  const totalTodoCount = todos.length;
  const activeTodoCount = todos.filter((t) => !t.isCompleted).length;
  const completedCount = todos.filter((t) => t.isCompleted).length;
  const allDone = totalTodoCount > 0 && completedCount === totalTodoCount;

  const currentHeroTodo = useMemo(() => getCurrentHeroTodo(todos), [todos]);

  const dailyHeroStatus = useHeroRevealStore((s) => s.dailyHeroStatus);
  const snapshotTodoIds = useHeroRevealStore((s) => s.snapshotTodoIds);
  const snapshotTodoCount = useHeroRevealStore((s) => s.snapshotTodoCount);

  const completedSnapshotCount = useMemo(() => {
    if (snapshotTodoIds.length === 0) return 0;
    const snapshotSet = new Set(snapshotTodoIds);
    return todos.filter((t) => snapshotSet.has(t.id) && t.isCompleted).length;
  }, [todos, snapshotTodoIds]);

  const snapshotFullyRevealed =
    snapshotTodoCount > 0 && completedSnapshotCount >= snapshotTodoCount;

  const userState: UserState = useMemo(() => {
    if (!onboardingSlidesCompleted || !accountGateCompleted) return "new_user";

    if (isPremium || paywallInteraction === "subscribed") {
      if (photoUploadStatus === "skipped") return "skipped_photo";
      if (!profilePhoto && photoUploadStatus === "not_started")
        return "subscribed_no_photo";
      if (avatarStatus === "processing") return "photo_uploaded_processing";
      if (avatarStatus === "ready" || profilePhoto) return "photo_ready";
      return "subscribed_no_photo";
    }

    if (paywallInteraction === "dismissed") return "paywall_dismissed";
    return "onboarded_unsubscribed";
  }, [
    onboardingSlidesCompleted,
    accountGateCompleted,
    isPremium,
    paywallInteraction,
    photoUploadStatus,
    avatarStatus,
    profilePhoto,
  ]);

  const heroVariant: HomeHeroVariant = useMemo(() => {
    const isSubscribedUser = isPremium || paywallInteraction === "subscribed";
    const hasUploadedPhoto = photoUploadStatus === "uploaded";

    // 1. Reveal state her zaman en yüksek öncelik
    if (
      dailyHeroStatus === "locked_reveal" ||
      dailyHeroStatus === "fully_revealed"
    ) {
      return snapshotFullyRevealed ? "fully_revealed" : "locked_reveal";
    }

    // 2. Henüz onboarding tamamlanmadıysa placeholder
    if (userState === "new_user") return "placeholder";

    // 3. Abone DEĞİLSE → premium_teaser (generating/avatarStatus bunu override etmesin)
    if (!isSubscribedUser) return "premium_teaser";

    // 4. Abone + fotoğraf yüklenmedi ve atlanmadı → upload_prompt
    if (!hasUploadedPhoto && photoUploadStatus !== "skipped") {
      return "upload_prompt";
    }

    // 5. Bu noktada kullanıcı abone ve fotoğraf yüklemiş (veya atlamış);
    //    artık "generating" / "processing" göstermek güvenli
    if (dailyHeroStatus === "generating") return "processing";

    if (
      avatarStatus === "processing" &&
      currentHeroTodo?.visualStatus !== "ready"
    ) {
      return "processing";
    }

    // skipped_photo veya photo_uploaded_processing için ek kontroller
    if (userState === "photo_uploaded_processing") {
      if (currentHeroTodo?.visualStatus !== "ready") return "processing";
    }

    if (totalTodoCount === 0) return "empty";
    if (totalTodoCount < TASK_MILESTONE_THRESHOLD) return "need_more_todos";

    if (allDone) return "all_done";

    if (currentHeroTodo?.visualStatus === "pending") return "todo_generating";
    if (currentHeroTodo?.visualStatus === "ready") return "todo_visual";

    return "todo_generating";
  }, [
    dailyHeroStatus,
    snapshotFullyRevealed,
    userState,
    avatarStatus,
    totalTodoCount,
    allDone,
    currentHeroTodo,
    isPremium,
    paywallInteraction,
    photoUploadStatus,
  ]);

  const taskMilestone: TaskMilestoneStatus = useMemo(() => {
    if (totalTodoCount === 0) return "no_tasks";
    if (totalTodoCount < TASK_MILESTONE_THRESHOLD) return "in_progress";
    if (isPremium && profilePhoto) return "generation_eligible";
    return "milestone_reached";
  }, [totalTodoCount, isPremium, profilePhoto]);

  const shouldShowPhotoValueSheet = useMemo(() => {
    if (photoValueSheetShown) return false;
    if (photoUploadStatus !== "not_started") return false;
    if (isPremium && profilePhoto) return false;
    return totalTodoCount >= 2;
  }, [photoValueSheetShown, photoUploadStatus, isPremium, profilePhoto, totalTodoCount]);

  const shouldTriggerPaywall = useMemo(() => {
    if (paywallInteraction === "subscribed" || isPremium) return false;
    if (isPaywallOnCooldown(paywallDismissedAt)) return false;
    return totalTodoCount >= TASK_MILESTONE_THRESHOLD;
  }, [paywallInteraction, isPremium, paywallDismissedAt, totalTodoCount]);

  const shouldPromptNotification = useMemo(() => {
    if (notificationPermission !== "not_asked") return false;
    return firstVisualDelivered;
  }, [notificationPermission, firstVisualDelivered]);

  const canTriggerGeneration = useMemo(() => {
    if (!isPremium && paywallInteraction !== "subscribed") return false;
    if (totalTodoCount < TASK_MILESTONE_THRESHOLD) return false;
    return true;
  }, [isPremium, paywallInteraction, totalTodoCount]);

  const tasksUntilMilestone = useMemo(
    () => Math.max(0, TASK_MILESTONE_THRESHOLD - totalTodoCount),
    [totalTodoCount],
  );

  const isOnboardingComplete = onboardingSlidesCompleted && accountGateCompleted;
  const isSubscribed = isPremium || paywallInteraction === "subscribed";
  const hasPhoto = !!profilePhoto || photoUploadStatus === "uploaded";

  const getNextAction = useCallback((): string | null => {
    if (!isOnboardingComplete) return "complete_onboarding";
    if (totalTodoCount === 0) return "add_first_task";
    if (totalTodoCount < TASK_MILESTONE_THRESHOLD) return "add_more_tasks";
    if (!isSubscribed) return "subscribe";
    if (!hasPhoto && photoUploadStatus !== "skipped") return "upload_photo";
    return null;
  }, [
    isOnboardingComplete,
    totalTodoCount,
    isSubscribed,
    hasPhoto,
    photoUploadStatus,
  ]);

  return {
    userState,
    heroVariant,
    taskMilestone,
    shouldShowPhotoValueSheet,
    shouldTriggerPaywall,
    shouldPromptNotification,
    canTriggerGeneration,
    tasksUntilMilestone,
    isOnboardingComplete,
    isSubscribed,
    isGuestUser,
    hasPhoto,
    activeTodoCount,
    totalTodoCount,
    taskCountAtLastCheck,
    firstVisualDelivered,
    currentHeroTodo,
    getNextAction,
  };
};
