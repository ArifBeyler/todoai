import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Frequency = "daily" | "every3days" | "weekly";

type SessionState = {
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  isPremium: boolean;
  profileName: string;
  profilePhoto: string | null;
  stylePreference: string;
  generationFrequency: Frequency;
  trialStartedAt: number | null;
  trialDurationDays: number;

  setAuthenticated: (value: boolean) => void;
  setPremium: (value: boolean) => void;
  setProfileName: (value: string) => void;
  setProfilePhoto: (value: string | null) => void;
  setStylePreference: (value: string) => void;
  setGenerationFrequency: (value: Frequency) => void;
  startTrial: () => void;
  completeOnboarding: () => void;
  signOut: () => void;
};

const TRIAL_DAYS = 7;

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      onboardingCompleted: false,
      isPremium: false,
      profileName: "",
      profilePhoto: null,
      stylePreference: "illustration",
      generationFrequency: "daily",
      trialStartedAt: null,
      trialDurationDays: TRIAL_DAYS,

      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setPremium: (value) => set({ isPremium: value }),
      setProfileName: (value) => set({ profileName: value }),
      setProfilePhoto: (value) => set({ profilePhoto: value }),
      setStylePreference: (value) => set({ stylePreference: value }),
      setGenerationFrequency: (value) => set({ generationFrequency: value }),

      startTrial: () =>
        set({
          isPremium: true,
          trialStartedAt: Date.now(),
        }),

      completeOnboarding: () => set({ onboardingCompleted: true }),

      signOut: () =>
        set({
          isAuthenticated: false,
          onboardingCompleted: false,
          isPremium: false,
          profileName: "",
          profilePhoto: null,
          stylePreference: "illustration",
          generationFrequency: "daily",
          trialStartedAt: null,
        }),
    }),
    {
      name: "dayframe-session",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const isTrialActive = (
  startedAt: number | null,
  durationDays: number,
): boolean => {
  if (!startedAt) return false;
  const elapsed = Date.now() - startedAt;
  return elapsed < durationDays * 24 * 60 * 60 * 1000;
};

export const trialDaysRemaining = (
  startedAt: number | null,
  durationDays: number,
): number => {
  if (!startedAt) return 0;
  const elapsed = Date.now() - startedAt;
  const remaining = durationDays - elapsed / (24 * 60 * 60 * 1000);
  return Math.max(0, Math.ceil(remaining));
};
