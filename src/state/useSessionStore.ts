import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, ensureAnonymousSession } from "@/src/services/supabase";

export type Frequency = "daily" | "every3days" | "weekly";

export type ProductiveTime = "morning" | "afternoon" | "evening" | "night";
export type MotivationSource = "achievement" | "social" | "reward" | "growth";

type SessionState = {
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  isPremium: boolean;
  profileName: string;
  profilePhoto: string | null;
  stylePreference: string;
  generationFrequency: Frequency;
  goals: string[];
  purposes: string[];
  productiveTime: ProductiveTime | "";
  challenges: string[];
  motivationSource: MotivationSource | "";
  painAgreements: string[];

  setAuthenticated: (value: boolean) => void;
  setPremium: (value: boolean) => void;
  setProfileName: (value: string) => void;
  setProfilePhoto: (value: string | null) => void;
  setStylePreference: (value: string) => void;
  setGenerationFrequency: (value: Frequency) => void;
  setGoals: (value: string[]) => void;
  setPurposes: (value: string[]) => void;
  setProductiveTime: (value: ProductiveTime) => void;
  setChallenges: (value: string[]) => void;
  setMotivationSource: (value: MotivationSource) => void;
  setPainAgreements: (value: string[]) => void;
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
      stylePreference: "3d",
      generationFrequency: "daily",
      goals: [],
      purposes: [],
      productiveTime: "",
      challenges: [],
      motivationSource: "",
      painAgreements: [],

      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setPremium: (value) => set({ isPremium: value }),
      setProfileName: (value) => set({ profileName: value }),
      setProfilePhoto: (value) => set({ profilePhoto: value }),
      setStylePreference: (value) => set({ stylePreference: value }),
      setGenerationFrequency: (value) => set({ generationFrequency: value }),
      setGoals: (value) => set({ goals: value }),
      setPurposes: (value) => set({ purposes: value }),
      setProductiveTime: (value) => set({ productiveTime: value }),
      setChallenges: (value) => set({ challenges: value }),
      setMotivationSource: (value) => set({ motivationSource: value }),
      setPainAgreements: (value) => set({ painAgreements: value }),

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
          stylePreference: "3d",
          generationFrequency: "daily",
          goals: [],
          purposes: [],
          productiveTime: "",
          challenges: [],
          motivationSource: "",
          painAgreements: [],
        });
      },
    }),
    {
      name: "doara-session",
      version: 5,
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
          return {
            ...persisted,
            painAgreements: [],
          };
        }
        return persisted as SessionState;
      },
      onRehydrateStorage: () => () => {
        sessionHydrated = true;
      },
    },
  ),
);
