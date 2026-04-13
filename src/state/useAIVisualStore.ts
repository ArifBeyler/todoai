import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AIVisualState =
  | "not_eligible"
  | "waiting_for_stability"
  | "eligible_paywall_locked"
  | "eligible_needs_profile"
  | "profile_generating"
  | "daily_visual_queued"
  | "daily_visual_generating"
  | "daily_visual_ready"
  | "daily_visual_failed";

export type ProfileGenerationState =
  | "idle"
  | "uploading"
  | "validating"
  | "queued"
  | "generating"
  | "ready"
  | "failed"
  | "delayed";

// Human-readable messages for each AI visual state shown in the home hero card
export const AI_VISUAL_STATE_MESSAGES: Record<
  AIVisualState,
  { title: string; subtitle: string }
> = {
  not_eligible: {
    title: "3 aktif görev ekle",
    subtitle: "İlk kişisel görselin açılsın.",
  },
  waiting_for_stability: {
    title: "Görevlerin sabitleniyor",
    subtitle: "Bir süre sonra değerlendireceğiz.",
  },
  eligible_paywall_locked: {
    title: "Kişisel AI görselleri açmak için",
    subtitle: "Premium'a geç.",
  },
  eligible_needs_profile: {
    title: "İlk görselini açmak için",
    subtitle: "Fotoğrafını ekle.",
  },
  profile_generating: {
    title: "Profilin hazırlanıyor",
    subtitle: "Yapay zekâ stilini oluşturuyor.",
  },
  daily_visual_queued: {
    title: "Günlük görsel sırada",
    subtitle: "Oluşturma başlamak üzere.",
  },
  daily_visual_generating: {
    title: "Bugünün görseli hazırlanıyor",
    subtitle: "Yapay zekâ çalışıyor.",
  },
  daily_visual_ready: {
    title: "Günün görseli hazır",
    subtitle: "Görevlerini tamamla, görseli aç.",
  },
  daily_visual_failed: {
    title: "Görsel oluşturulamadı",
    subtitle: "Tekrar dene.",
  },
};

// Progressive messages shown during profile generation
export const PROFILE_GENERATION_MESSAGES: Record<ProfileGenerationState, string> = {
  idle: "",
  uploading: "Fotoğraf işleniyor",
  validating: "Sana uygun stil hazırlanıyor",
  queued: "İlk profil görselin oluşturuluyor",
  generating: "Son dokunuşlar yapılıyor",
  ready: "Profilin hazır!",
  failed: "Profil oluşturulamadı",
  delayed:
    "Hazırlama beklediğimizden uzun sürüyor. Arka planda devam ediyor, hazır olunca haber vereceğiz.",
};

const PROFILE_GENERATION_TIMEOUT_MS = 90_000;

type AIVisualStoreState = {
  state: AIVisualState;
  jobVersion: number;
  jobStartedAt: string | null;
  stabilityStartedAt: string | null;
  imageUrl: string | null;
  snapshotTodoIds: string[];
  snapshotTodoHashes: string;
  dailyVisualDate: string | null;
  error: string | null;

  profileGenerationState: ProfileGenerationState;
  profileGenerationStartedAt: string | null;

  // Actions
  transitionTo: (next: AIVisualState, opts?: { error?: string }) => void;
  startDailyVisualJob: (todoIds: string[], todoHashes: string) => void;
  setDailyVisualReady: (imageUrl: string) => void;
  markJobStale: () => void;
  retryDailyVisual: () => void;
  resetDailyVisual: () => void;

  setProfileGenerationState: (s: ProfileGenerationState) => void;
  startProfileGeneration: () => void;
  completeProfileGeneration: () => void;
  failProfileGeneration: () => void;
  timeoutProfileGeneration: () => void;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export const useAIVisualStore = create<AIVisualStoreState>()(
  persist(
    (set, get) => ({
      state: "not_eligible",
      jobVersion: 0,
      jobStartedAt: null,
      stabilityStartedAt: null,
      imageUrl: null,
      snapshotTodoIds: [],
      snapshotTodoHashes: "",
      dailyVisualDate: null,
      error: null,

      profileGenerationState: "idle",
      profileGenerationStartedAt: null,

      transitionTo: (next, opts) =>
        set((s) => ({
          state: next,
          error: opts?.error ?? (next === "daily_visual_failed" ? s.error : null),
          stabilityStartedAt:
            next === "waiting_for_stability" && s.state === "not_eligible"
              ? new Date().toISOString()
              : s.stabilityStartedAt,
        })),

      startDailyVisualJob: (todoIds, todoHashes) =>
        set((s) => ({
          state: "daily_visual_generating",
          jobVersion: s.jobVersion + 1,
          jobStartedAt: new Date().toISOString(),
          snapshotTodoIds: [...todoIds],
          snapshotTodoHashes: todoHashes,
          dailyVisualDate: todayStr(),
          imageUrl: null,
          error: null,
        })),

      setDailyVisualReady: (imageUrl) =>
        set({
          state: "daily_visual_ready",
          imageUrl,
          error: null,
        }),

      // Marks the current job stale (todos changed mid-generation).
      // Does NOT trigger a notification. Caller must check state before notifying.
      markJobStale: () =>
        set((s) => ({
          state: "daily_visual_failed",
          error: "Görevler değişti, görsel geçersiz sayıldı.",
          // Keep snapshotTodoIds/Hashes so UI can explain what happened
          jobVersion: s.jobVersion,
        })),

      retryDailyVisual: () =>
        set((s) => {
          if (s.state !== "daily_visual_failed") return {};
          return {
            state: "daily_visual_queued",
            error: null,
          };
        }),

      resetDailyVisual: () =>
        set({
          state: "not_eligible",
          jobStartedAt: null,
          imageUrl: null,
          snapshotTodoIds: [],
          snapshotTodoHashes: "",
          dailyVisualDate: null,
          error: null,
        }),

      setProfileGenerationState: (s) =>
        set({ profileGenerationState: s }),

      startProfileGeneration: () =>
        set({
          state: "profile_generating",
          profileGenerationState: "uploading",
          profileGenerationStartedAt: new Date().toISOString(),
          error: null,
        }),

      completeProfileGeneration: () =>
        set({
          profileGenerationState: "ready",
          state: "daily_visual_queued",
        }),

      failProfileGeneration: () =>
        set((s) => ({
          profileGenerationState: "failed",
          state: "eligible_needs_profile",
          error: "Profil oluşturulamadı.",
          profileGenerationStartedAt: null,
        })),

      timeoutProfileGeneration: () =>
        set((s) => {
          const ps = s.profileGenerationState;
          if (ps !== "generating" && ps !== "queued" && ps !== "validating") {
            return {};
          }
          return {
            profileGenerationState: "delayed",
            // Keep state as profile_generating so UI shows the delayed message
          };
        }),
    }),
    {
      name: "doara-ai-visual",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// Guard: returns true only if it's safe to deliver a daily visual notification.
// All conditions must pass to prevent false-positive "Günün görseli hazır" notifications.
export const canDeliverVisualNotification = (opts: {
  state: AIVisualState;
  imageUrl: string | null;
  isPremium: boolean;
  profileGenerationState: ProfileGenerationState;
  currentTodoHashes: string;
  snapshotTodoHashes: string;
}): boolean => {
  if (opts.state !== "daily_visual_ready") return false;
  if (!opts.imageUrl) return false;
  if (!opts.isPremium) return false;
  if (opts.profileGenerationState !== "ready") return false;
  if (opts.currentTodoHashes !== opts.snapshotTodoHashes) return false;
  return true;
};

export const PROFILE_GENERATION_TIMEOUT = PROFILE_GENERATION_TIMEOUT_MS;
