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

export type TodoShakeReveal = {
  todoId: string | null;
  isRevealed: boolean;
  revealedAt: string | null;
};

type HeroRevealState = {
  dailyHeroStatus: DailyHeroStatus;
  dailyHeroDate: string | null;
  generatedAt: string | null;

  snapshotTodoIds: string[];
  snapshotTodoCount: number;

  dailyHeroImageUrl: string | null;
  dailyHeroError: string | null;

  // Shake-to-reveal on the first todo visual after a batch completes. Persists
  // so the user doesn't see the blur a second time.
  todoShakeReveal: TodoShakeReveal;

  startGeneration: (todoIds: string[]) => void;
  setHeroReady: (imageUrl: string) => void;
  setHeroError: (error: string) => void;
  retryGeneration: () => void;
  resetDailyHero: () => void;
  primeTodoShakeReveal: (todoId: string) => void;
  markTodoShakeRevealed: () => void;
  resetTodoShakeReveal: () => void;
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

      todoShakeReveal: { todoId: null, isRevealed: false, revealedAt: null },

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

      primeTodoShakeReveal: (todoId: string) => {
        const current = get().todoShakeReveal;
        if (current.todoId === todoId) return;
        set({
          todoShakeReveal: {
            todoId,
            isRevealed: false,
            revealedAt: null,
          },
        });
      },

      markTodoShakeRevealed: () => {
        const current = get().todoShakeReveal;
        if (!current.todoId || current.isRevealed) return;
        set({
          todoShakeReveal: {
            ...current,
            isRevealed: true,
            revealedAt: new Date().toISOString(),
          },
        });
      },

      resetTodoShakeReveal: () =>
        set({
          todoShakeReveal: { todoId: null, isRevealed: false, revealedAt: null },
        }),
    }),
    {
      name: "doara-hero-reveal",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
