import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type PhotoUploadStatus =
  | "not_started"
  | "skipped"
  | "uploading"
  | "uploaded"
  | "failed";

export type AvatarStatus = "none" | "processing" | "ready" | "failed";

export type PaywallInteraction =
  | "not_shown"
  | "shown"
  | "dismissed"
  | "subscribed";

export type NotificationPermission =
  | "not_asked"
  | "granted"
  | "denied"
  | "skipped";

export type GenerationEligibility =
  | "not_eligible"
  | "eligible"
  | "triggered"
  | "pending"
  | "completed"
  | "failed";

type FTUEState = {
  onboardingSlidesCompleted: boolean;
  accountGateCompleted: boolean;
  isGuestUser: boolean;

  photoUploadStatus: PhotoUploadStatus;
  avatarStatus: AvatarStatus;
  paywallInteraction: PaywallInteraction;
  notificationPermission: NotificationPermission;
  generationEligibility: GenerationEligibility;

  paywallDismissedAt: number | null;
  paywallShowCount: number;
  photoValueSheetShown: boolean;
  firstVisualDelivered: boolean;
  taskCountAtLastCheck: number;
  hasSeenHomeScreen: boolean;

  completeSlidesOnboarding: () => void;
  completeAccountGate: (isGuest: boolean) => void;
  setPhotoUploadStatus: (status: PhotoUploadStatus) => void;
  setAvatarStatus: (status: AvatarStatus) => void;
  showPaywall: () => void;
  dismissPaywall: () => void;
  markSubscribed: () => void;
  setNotificationPermission: (status: NotificationPermission) => void;
  markPhotoValueSheetShown: () => void;
  setGenerationEligibility: (status: GenerationEligibility) => void;
  markFirstVisualDelivered: () => void;
  updateTaskCount: (count: number) => void;
  markHomeScreenSeen: () => void;
  resetFTUE: () => void;
  resetOnboardingMidpoint: () => void;
};

const PAYWALL_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export const TASK_MILESTONE_THRESHOLD = 3;

export const isPaywallOnCooldown = (dismissedAt: number | null): boolean => {
  if (!dismissedAt) return false;
  return Date.now() - dismissedAt < PAYWALL_COOLDOWN_MS;
};

let ftueHydrated = false;
export const isFTUEHydrated = () => ftueHydrated;

export const useFTUEStore = create<FTUEState>()(
  persist(
    (set) => ({
      onboardingSlidesCompleted: false,
      accountGateCompleted: false,
      isGuestUser: false,

      photoUploadStatus: "not_started",
      avatarStatus: "none",
      paywallInteraction: "not_shown",
      notificationPermission: "not_asked",
      generationEligibility: "not_eligible",

      paywallDismissedAt: null,
      paywallShowCount: 0,
      photoValueSheetShown: false,
      firstVisualDelivered: false,
      taskCountAtLastCheck: 0,
      hasSeenHomeScreen: false,

      completeSlidesOnboarding: () =>
        set({ onboardingSlidesCompleted: true }),

      completeAccountGate: (isGuest) =>
        set({ accountGateCompleted: true, isGuestUser: isGuest }),

      setPhotoUploadStatus: (status) =>
        set({ photoUploadStatus: status }),

      setAvatarStatus: (status) => set({ avatarStatus: status }),

      showPaywall: () =>
        set((s) => ({
          paywallInteraction:
            s.paywallInteraction === "subscribed" ? "subscribed" : "shown",
          paywallShowCount: s.paywallShowCount + 1,
        })),

      dismissPaywall: () =>
        set({
          paywallInteraction: "dismissed",
          paywallDismissedAt: Date.now(),
        }),

      markSubscribed: () =>
        set({
          paywallInteraction: "subscribed",
          paywallDismissedAt: null,
        }),

      setNotificationPermission: (status) =>
        set({ notificationPermission: status }),

      markPhotoValueSheetShown: () =>
        set({ photoValueSheetShown: true }),

      setGenerationEligibility: (status) =>
        set({ generationEligibility: status }),

      markFirstVisualDelivered: () =>
        set({ firstVisualDelivered: true }),

      updateTaskCount: (count) =>
        set({ taskCountAtLastCheck: count }),

      markHomeScreenSeen: () =>
        set({ hasSeenHomeScreen: true }),

      resetFTUE: () =>
        set({
          onboardingSlidesCompleted: false,
          accountGateCompleted: false,
          isGuestUser: false,
          photoUploadStatus: "not_started",
          avatarStatus: "none",
          paywallInteraction: "not_shown",
          notificationPermission: "not_asked",
          generationEligibility: "not_eligible",
          paywallDismissedAt: null,
          paywallShowCount: 0,
          photoValueSheetShown: false,
          firstVisualDelivered: false,
          taskCountAtLastCheck: 0,
          hasSeenHomeScreen: false,
        }),

      resetOnboardingMidpoint: () =>
        set({ onboardingSlidesCompleted: false }),
    }),
    {
      name: "doara-ftue",
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted: any, version: number) => {
        if (version < 2) {
          return {
            ...persisted,
            onboardingSlidesCompleted: false,
            accountGateCompleted: false,
            isGuestUser: false,
          };
        }
        if (version < 3) {
          return {
            ...persisted,
            hasSeenHomeScreen: false,
          };
        }
        return persisted as FTUEState;
      },
      onRehydrateStorage: () => () => {
        ftueHydrated = true;
      },
    },
  ),
);
