import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, ensureAnonymousSession } from "@/src/services/supabase";

export type Frequency = "daily" | "every3days" | "weekly";

export type ProductiveTime = "morning" | "afternoon" | "evening" | "night";
export type MotivationSource = "achievement" | "social" | "reward" | "growth";

// Calculates a daily hydration goal in millilitres using Mifflin-St Jeor BMR.
// Returns null when inputs are missing. Clamped to 1500–3500 ml, rounded to 250 ml.
export const deriveHydrationGoalMl = (
  weightKg: number | null,
  heightCm: number | null,
): number | null => {
  if (!weightKg || !heightCm) return null;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5;
  const baseWaterMl = Math.round((bmr / 1000) * 35);
  return Math.max(1500, Math.min(3500, Math.round(baseWaterMl / 250) * 250));
};

type SessionState = {
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  isPremium: boolean;
  profileName: string;
  /** Original photo uploaded by the user — kept for transition animations */
  profilePhoto: string | null;
  /** AI-generated avatar URL — set when generation completes, before reveal is dismissed */
  generatedAvatarUrl: string | null;
  stylePreference: string;
  generationFrequency: Frequency;
  goals: string[];
  purposes: string[];
  productiveTime: ProductiveTime | "";
  challenges: string[];
  motivationSource: MotivationSource | "";
  painAgreements: string[];

  // Body metrics for hydration personalisation
  heightCm: number | null;
  weightKg: number | null;

  // Active hours for water reminder scheduling (0–23)
  activeHoursStart: number | null;
  activeHoursEnd: number | null;

  // Derived hydration goal (set explicitly after onboarding so it persists)
  hydrationGoalMl: number | null;
  waterReminderEnabled: boolean;

  /** Persisted hero image URL — avoids flash of wrong content on restart */
  cachedHeroImageUrl: string | null;

  setAuthenticated: (value: boolean) => void;
  setPremium: (value: boolean) => void;
  setProfileName: (value: string) => void;
  setProfilePhoto: (value: string | null) => void;
  setGeneratedAvatarUrl: (value: string | null) => void;
  /** Promotes generatedAvatarUrl → profilePhoto (called when user dismisses reveal screen) */
  confirmGeneratedAvatar: () => void;
  setStylePreference: (value: string) => void;
  setGenerationFrequency: (value: Frequency) => void;
  setGoals: (value: string[]) => void;
  setPurposes: (value: string[]) => void;
  setProductiveTime: (value: ProductiveTime) => void;
  setChallenges: (value: string[]) => void;
  setMotivationSource: (value: MotivationSource) => void;
  setPainAgreements: (value: string[]) => void;
  setHeightCm: (value: number | null) => void;
  setWeightKg: (value: number | null) => void;
  setActiveHours: (start: number | null, end: number | null) => void;
  setHydrationGoalMl: (value: number | null) => void;
  setWaterReminderEnabled: (value: boolean) => void;
  setCachedHeroImageUrl: (value: string | null) => void;
  completeOnboarding: () => void;
  signOut: () => void;
};

let sessionHydrated = false;
export const isSessionHydrated = () => sessionHydrated;

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      isAuthenticated: true,
      onboardingCompleted: false,
      isPremium: false,
      profileName: "",
      profilePhoto: null,
      generatedAvatarUrl: null,
      stylePreference: "3d",
      generationFrequency: "daily",
      goals: [],
      purposes: [],
      productiveTime: "",
      challenges: [],
      motivationSource: "",
      painAgreements: [],

      heightCm: null,
      weightKg: null,
      activeHoursStart: null,
      activeHoursEnd: null,
      hydrationGoalMl: null,
      waterReminderEnabled: false,
      cachedHeroImageUrl: null,

      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setPremium: (value) => set({ isPremium: value }),
      setProfileName: (value) => set({ profileName: value }),
      setProfilePhoto: (value) => set({ profilePhoto: value }),
      setGeneratedAvatarUrl: (value) => set({ generatedAvatarUrl: value }),
      confirmGeneratedAvatar: () =>
        set((s) =>
          s.generatedAvatarUrl
            ? { profilePhoto: s.generatedAvatarUrl, generatedAvatarUrl: null }
            : {},
        ),
      setStylePreference: (value) => set({ stylePreference: value }),
      setGenerationFrequency: (value) => set({ generationFrequency: value }),
      setGoals: (value) => set({ goals: value }),
      setPurposes: (value) => set({ purposes: value }),
      setProductiveTime: (value) => set({ productiveTime: value }),
      setChallenges: (value) => set({ challenges: value }),
      setMotivationSource: (value) => set({ motivationSource: value }),
      setPainAgreements: (value) => set({ painAgreements: value }),

      setHeightCm: (value) => set({ heightCm: value }),
      setWeightKg: (value) => set({ weightKg: value }),
      setActiveHours: (start, end) =>
        set({ activeHoursStart: start, activeHoursEnd: end }),
      setHydrationGoalMl: (value) => set({ hydrationGoalMl: value }),
      setWaterReminderEnabled: (value) => set({ waterReminderEnabled: value }),
      setCachedHeroImageUrl: (value) => set({ cachedHeroImageUrl: value }),

      completeOnboarding: () => set({ onboardingCompleted: true }),

      signOut: () => {
        supabase.auth.signOut().then(() => {
          ensureAnonymousSession();
        });
        set({
          isAuthenticated: true,
          onboardingCompleted: false,
          isPremium: false,
          profileName: "",
          profilePhoto: null,
          generatedAvatarUrl: null,
          stylePreference: "3d",
          generationFrequency: "daily",
          goals: [],
          purposes: [],
          productiveTime: "",
          challenges: [],
          motivationSource: "",
          painAgreements: [],
          heightCm: null,
          weightKg: null,
          activeHoursStart: null,
          activeHoursEnd: null,
          hydrationGoalMl: null,
          waterReminderEnabled: false,
          cachedHeroImageUrl: null,
        });
      },
    }),
    {
      name: "doara-session",
      version: 8,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted: any, version: number) => {
        if (version < 2) {
          return {
            ...persisted,
            onboardingCompleted: false,
            profileName: "",
            goals: [],
            purposes: [],
            stylePreference:
              persisted.stylePreference === "anime"
                ? "lofi"
                : persisted.stylePreference ?? "3d",
          };
        }
        if (version < 3) {
          return {
            ...persisted,
            stylePreference:
              persisted.stylePreference === "anime"
                ? "lofi"
                : persisted.stylePreference ?? "3d",
          };
        }
        if (version < 4) {
          return {
            ...persisted,
            productiveTime: "",
            challenges: [],
            motivationSource: "",
            painAgreements: [],
          };
        }
        if (version < 5) {
          return { ...persisted, painAgreements: [] };
        }
        if (version < 6) {
          return {
            ...persisted,
            heightCm: null,
            weightKg: null,
            activeHoursStart: null,
            activeHoursEnd: null,
            hydrationGoalMl: null,
            waterReminderEnabled: false,
          };
        }
        if (version < 7) {
          return { ...persisted, generatedAvatarUrl: null };
        }
        if (version < 8) {
          return { ...persisted, cachedHeroImageUrl: null };
        }
        return persisted as SessionState;
      },
      onRehydrateStorage: () => () => {
        sessionHydrated = true;
      },
    },
  ),
);
