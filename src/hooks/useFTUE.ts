import { useCallback, useMemo } from "react";
import { useSessionStore } from "@state/useSessionStore";
import {
  useFTUEStore,
  isPaywallOnCooldown,
  TASK_MILESTONE_THRESHOLD,
} from "@state/useFTUEStore";
import { useTodoStore } from "@state/useTodoStore";

export type UserState =
  | "new_user"
  | "onboarded_unsubscribed"
  | "subscribed_no_photo"
  | "photo_uploaded_processing"
  | "photo_ready"
  | "paywall_dismissed"
  | "skipped_photo";

export type HomeHeroVariant =
  | "placeholder"
  | "premium_teaser"
  | "upload_prompt"
  | "processing"
  | "personalized"
  | "generation_pending"
  | "generation_complete";

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
  const activeTodoCount = todos.filter((t) => !t.isCompleted).length;

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
    if (generationEligibility === "completed" || firstVisualDelivered)
      return "generation_complete";
    if (generationEligibility === "pending") return "generation_pending";
    if (avatarStatus === "processing") return "processing";

    switch (userState) {
      case "new_user":
        return "placeholder";
      case "subscribed_no_photo":
        return "upload_prompt";
      case "photo_uploaded_processing":
        return "processing";
      case "photo_ready":
        return "personalized";
      case "skipped_photo":
        return "placeholder";
      case "paywall_dismissed":
      case "onboarded_unsubscribed":
        return "premium_teaser";
      default:
        return "placeholder";
    }
  }, [userState, avatarStatus, generationEligibility, firstVisualDelivered]);

  const taskMilestone: TaskMilestoneStatus = useMemo(() => {
    if (activeTodoCount === 0) return "no_tasks";
    if (activeTodoCount < TASK_MILESTONE_THRESHOLD) return "in_progress";
    if (isPremium && profilePhoto) return "generation_eligible";
    return "milestone_reached";
  }, [activeTodoCount, isPremium, profilePhoto]);

  const shouldShowPhotoValueSheet = useMemo(() => {
    if (photoValueSheetShown) return false;
    if (photoUploadStatus !== "not_started") return false;
    if (isPremium && profilePhoto) return false;
    return activeTodoCount >= 2;
  }, [
    photoValueSheetShown,
    photoUploadStatus,
    isPremium,
    profilePhoto,
    activeTodoCount,
  ]);

  const shouldTriggerPaywall = useMemo(() => {
    if (paywallInteraction === "subscribed" || isPremium) return false;
    if (isPaywallOnCooldown(paywallDismissedAt)) return false;
    return activeTodoCount >= TASK_MILESTONE_THRESHOLD;
  }, [paywallInteraction, isPremium, paywallDismissedAt, activeTodoCount]);

  const shouldPromptNotification = useMemo(() => {
    if (notificationPermission !== "not_asked") return false;
    return firstVisualDelivered;
  }, [notificationPermission, firstVisualDelivered]);

  const canTriggerGeneration = useMemo(() => {
    if (!isPremium && paywallInteraction !== "subscribed") return false;
    if (activeTodoCount < TASK_MILESTONE_THRESHOLD) return false;
    if (
      generationEligibility === "pending" ||
      generationEligibility === "completed"
    )
      return false;
    return true;
  }, [isPremium, paywallInteraction, activeTodoCount, generationEligibility]);

  const tasksUntilMilestone = useMemo(
    () => Math.max(0, TASK_MILESTONE_THRESHOLD - activeTodoCount),
    [activeTodoCount],
  );

  const isOnboardingComplete = onboardingSlidesCompleted && accountGateCompleted;
  const isSubscribed = isPremium || paywallInteraction === "subscribed";
  const hasPhoto = !!profilePhoto || photoUploadStatus === "uploaded";

  const getNextAction = useCallback((): string | null => {
    if (!isOnboardingComplete) return "complete_onboarding";
    if (activeTodoCount === 0) return "add_first_task";
    if (activeTodoCount < TASK_MILESTONE_THRESHOLD) return "add_more_tasks";
    if (!isSubscribed) return "subscribe";
    if (!hasPhoto && photoUploadStatus !== "skipped") return "upload_photo";
    if (canTriggerGeneration) return "trigger_generation";
    return null;
  }, [
    isOnboardingComplete,
    activeTodoCount,
    isSubscribed,
    hasPhoto,
    photoUploadStatus,
    canTriggerGeneration,
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
    taskCountAtLastCheck,
    firstVisualDelivered,
    getNextAction,
  };
};
