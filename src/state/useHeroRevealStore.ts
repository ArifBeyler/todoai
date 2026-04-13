import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type DailyHeroStatus =
  | "idle"
  | "eligible"
  | "generating"
  | "locked_reveal"
  | "fully_revealed"
  | "failed";

type HeroRevealState = {
  dailyHeroStatus: DailyHeroStatus;
  dailyHeroDate: string | null;
  generatedAt: string | null;

  snapshotTodoIds: string[];
  snapshotTodoCount: number;

  dailyHeroImageUrl: string | null;
  dailyHeroError: string | null;

  startGeneration: (todoIds: string[]) => void;
  setHeroReady: (imageUrl: string) => void;
  setHeroError: (error: string) => void;
  retryGeneration: () => void;
  resetDailyHero: () => void;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export const useHeroRevealStore = create<HeroRevealState>()(
  persist(
    (set, get) => ({
      dailyHeroStatus: "idle",
      dailyHeroDate: null,
      generatedAt: null,

      snapshotTodoIds: [],
      snapshotTodoCount: 0,

      dailyHeroImageUrl: null,
      dailyHeroError: null,

      startGeneration: (todoIds: string[]) => {
        const today = todayStr();
        const current = get();

        if (
          current.dailyHeroDate === today &&
          current.dailyHeroStatus !== "idle" &&
          current.dailyHeroStatus !== "failed"
        ) {
          return;
        }

        set({
          dailyHeroStatus: "generating",
          dailyHeroDate: today,
          generatedAt: new Date().toISOString(),
          snapshotTodoIds: [...todoIds],
          snapshotTodoCount: todoIds.length,
          dailyHeroImageUrl: null,
          dailyHeroError: null,
        });
      },

      setHeroReady: (imageUrl: string) => {
        set({
          dailyHeroStatus: "locked_reveal",
          dailyHeroImageUrl: imageUrl,
          dailyHeroError: null,
        });
      },

      setHeroError: (error: string) => {
        set({
          dailyHeroStatus: "failed",
          dailyHeroError: error,
        });
      },

      retryGeneration: () => {
        const current = get();
        if (current.dailyHeroStatus !== "failed") return;

        set({
          dailyHeroStatus: "generating",
          dailyHeroError: null,
        });
      },

      resetDailyHero: () => {
        set({
          dailyHeroStatus: "idle",
          dailyHeroDate: null,
          generatedAt: null,
          snapshotTodoIds: [],
          snapshotTodoCount: 0,
          dailyHeroImageUrl: null,
          dailyHeroError: null,
        });
      },
    }),
    {
      name: "doara-hero-reveal",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
