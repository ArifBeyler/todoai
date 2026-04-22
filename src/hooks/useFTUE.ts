import { useCallback, useMemo } from "react";
import { useSessionStore } from "@state/useSessionStore";
import {
  useFTUEStore,
  isPaywallOnCooldown,
  TASK_MILESTONE_THRESHOLD,
} from "@state/useFTUEStore";
import { useHeroRevealStore } from "@state/useHeroRevealStore";
import { useTodoStore, getEligibleTodos, getCurrentHeroTodo } from "@state/useTodoStore";
import { useAIVisualStore, type AIVisualState } from "@state/useAIVisualStore";

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
  | "waiting_for_stability"
  | "eligible_paywall_locked"
  | "eligible_needs_profile"
  | "profile_generating"
  | "daily_visual_queued"
  | "daily_visual_generating"
  | "daily_visual_ready"
  | "daily_visual_failed"
  | "starter_hero"
  | "todo_visual"
  | "todo_generating"
  | "todo_batch_generating"
  | "todo_shake_reveal"
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
    paywallDismissedAt,
    photoValueSheetShown,
    firstVisualDelivered,
    taskCountAtLastCheck,
  } = useFTUEStore();

  const { isPremium, profilePhoto } = useSessionStore();
  const todos = useTodoStore((s) => s.todos);
  const generationBatch = useTodoStore((s) => s.generationBatch);
  const todoShakeReveal = useHeroRevealStore((s) => s.todoShakeReveal);

  // Use eligible active todos (non-deleted, non-completed, valid title) for all counts
  const eligibleTodos = useMemo(() => getEligibleTodos(todos), [todos]);
  const eligibleTodoCount = eligibleTodos.length;

  // Keep totalTodoCount for legacy UI (visible task counts)
  const allActiveTodos = useMemo(
    () => todos.filter((t) => t.deletedAt == null && !t.isCompleted),
    [todos],
  );
  const totalTodoCount = allActiveTodos.length;
  const completedCount = todos.filter((t) => t.isCompleted && t.deletedAt == null).length;
  const allDone = totalTodoCount > 0 && completedCount === todos.filter((t) => t.deletedAt == null).length;

  const currentHeroTodo = useMemo(() => getCurrentHeroTodo(todos), [todos]);

  const dailyHeroStatus = useHeroRevealStore((s) => s.dailyHeroStatus);
  const snapshotTodoIds = useHeroRevealStore((s) => s.snapshotTodoIds);
  const snapshotTodoCount = useHeroRevealStore((s) => s.snapshotTodoCount);

  // AI visual state from the new unified store
  const aiVisualState = useAIVisualStore((s) => s.state);

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

    // 1. Reveal state always takes highest priority
    if (
      dailyHeroStatus === "locked_reveal" ||
      dailyHeroStatus === "fully_revealed"
    ) {
      return snapshotFullyRevealed ? "fully_revealed" : "locked_reveal";
    }

    // 2. Not onboarded yet
    if (userState === "new_user") return "placeholder";

    // 3. Not subscribed → show the AI visual state messages (premium_teaser is for 0 todos case)
    if (!isSubscribedUser) {
      // Map AI visual states for non-subscribers
      if (aiVisualState === "not_eligible" && eligibleTodoCount === 0) return "premium_teaser";
      if (aiVisualState === "not_eligible") return "premium_teaser";
      if (aiVisualState === "waiting_for_stability") return "waiting_for_stability";
      if (aiVisualState === "eligible_paywall_locked") return "eligible_paywall_locked";
      return "premium_teaser";
    }

    // 4. Subscribed + no photo → direct to profile upload
    if (!hasUploadedPhoto && photoUploadStatus !== "skipped") {
      if (aiVisualState === "eligible_needs_profile") return "eligible_needs_profile";
      return "upload_prompt";
    }

    // 5. Profile being generated
    if (
      aiVisualState === "profile_generating" ||
      (avatarStatus === "processing" && currentHeroTodo?.visualStatus !== "ready")
    ) {
      return "profile_generating";
    }

    if (dailyHeroStatus === "generating") return "daily_visual_generating";

    // 6. Batch generation and shake-reveal take priority over the AI state
    // machine. The eligibility engine may still report "not_eligible" while
    // a batch is already running (state machines are async), so we must check
    // these BEFORE the aiVisualState switch to avoid an invisible batch.
    if (generationBatch.status === "running") return "todo_batch_generating";

    if (
      generationBatch.status === "done" &&
      todoShakeReveal.todoId &&
      !todoShakeReveal.isRevealed
    ) {
      return "todo_shake_reveal";
    }

    // 7. Map AI visual states to hero variants (subscribed users with profile)
    switch (aiVisualState) {
      case "not_eligible":
        if (eligibleTodoCount === 0) return "empty";
        return "need_more_todos";
      case "waiting_for_stability":
        return "waiting_for_stability";
      case "eligible_needs_profile":
        return "eligible_needs_profile";
      case "daily_visual_queued":
        return "daily_visual_queued";
      case "daily_visual_generating":
        return "daily_visual_generating";
      case "daily_visual_ready":
        return "daily_visual_ready";
      case "daily_visual_failed":
        return "daily_visual_failed";
      default:
        break;
    }

    if (totalTodoCount === 0) return "empty";
    if (eligibleTodoCount < TASK_MILESTONE_THRESHOLD) return "need_more_todos";
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
    eligibleTodoCount,
    allDone,
    currentHeroTodo,
    isPremium,
    paywallInteraction,
    photoUploadStatus,
    aiVisualState,
    generationBatch.status,
    todoShakeReveal.todoId,
    todoShakeReveal.isRevealed,
  ]);

  // taskMilestone uses eligible todo count, not total
  const taskMilestone: TaskMilestoneStatus = useMemo(() => {
    if (eligibleTodoCount === 0) return "no_tasks";
    if (eligibleTodoCount < TASK_MILESTONE_THRESHOLD) return "in_progress";
    if (isPremium && profilePhoto) return "generation_eligible";
    return "milestone_reached";
  }, [eligibleTodoCount, isPremium, profilePhoto]);

  const shouldShowPhotoValueSheet = useMemo(() => {
    if (photoValueSheetShown) return false;
    if (photoUploadStatus !== "not_started") return false;
    if (isPremium && profilePhoto) return false;
    return eligibleTodoCount >= 2;
  }, [photoValueSheetShown, photoUploadStatus, isPremium, profilePhoto, eligibleTodoCount]);

  const shouldTriggerPaywall = useMemo(() => {
    if (paywallInteraction === "subscribed" || isPremium) return false;
    if (isPaywallOnCooldown(paywallDismissedAt)) return false;
    return eligibleTodoCount >= TASK_MILESTONE_THRESHOLD;
  }, [paywallInteraction, isPremium, paywallDismissedAt, eligibleTodoCount]);

  const shouldPromptNotification = useMemo(() => {
    if (notificationPermission !== "not_asked") return false;
    if (firstVisualDelivered) return true;
    return totalTodoCount >= TASK_MILESTONE_THRESHOLD;
  }, [notificationPermission, firstVisualDelivered, totalTodoCount]);

  const canTriggerGeneration = useMemo(() => {
    if (!isPremium && paywallInteraction !== "subscribed") return false;
    if (eligibleTodoCount < TASK_MILESTONE_THRESHOLD) return false;
    return true;
  }, [isPremium, paywallInteraction, eligibleTodoCount]);

  const tasksUntilMilestone = useMemo(
    () => Math.max(0, TASK_MILESTONE_THRESHOLD - eligibleTodoCount),
    [eligibleTodoCount],
  );

  const isOnboardingComplete = onboardingSlidesCompleted && accountGateCompleted;
  const isSubscribed = isPremium || paywallInteraction === "subscribed";
  const hasPhoto = !!profilePhoto || photoUploadStatus === "uploaded";

  const getNextAction = useCallback((): string | null => {
    if (!isOnboardingComplete) return "complete_onboarding";
    if (eligibleTodoCount === 0) return "add_first_task";
    if (eligibleTodoCount < TASK_MILESTONE_THRESHOLD) return "add_more_tasks";
    if (!isSubscribed) return "subscribe";
    if (!hasPhoto && photoUploadStatus !== "skipped") return "upload_photo";
    return null;
  }, [
    isOnboardingComplete,
    eligibleTodoCount,
    isSubscribed,
    hasPhoto,
    photoUploadStatus,
  ]);

  return {
    userState,
    heroVariant,
    taskMilestone,
    aiVisualState,
    shouldShowPhotoValueSheet,
    shouldTriggerPaywall,
    shouldPromptNotification,
    canTriggerGeneration,
    tasksUntilMilestone,
    isOnboardingComplete,
    isSubscribed,
    isGuestUser,
    hasPhoto,
    activeTodoCount: totalTodoCount,
    eligibleTodoCount,
    totalTodoCount,
    taskCountAtLastCheck,
    firstVisualDelivered,
    currentHeroTodo,
    generationBatch,
    todoShakeReveal,
    getNextAction,
  };
};
