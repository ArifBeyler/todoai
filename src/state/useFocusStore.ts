import { create } from "zustand";

export type FocusMode = "focus" | "shortBreak" | "longBreak";
export type FocusSessionStatus = "idle" | "active" | "paused" | "completed" | "abandoned" | "interrupted";

export type FocusSessionModel = {
  id: string;
  selectedTodoIds: string[];
  duration: number;
  startedAt: string;
  completedAt?: string;
  status: FocusSessionStatus;
  faceDownEnabled: boolean;
  pauseCount: number;
  totalPauseDuration: number;
  pointsAwarded: number;
  interruptionCount: number;
};

type FocusState = {
  mode: FocusMode;
  sessionStatus: FocusSessionStatus;
  selectedTodoIds: string[];
  selectedDuration: number;
  remainingSeconds: number;
  faceDownEnabled: boolean;
  pauseCount: number;
  totalPauseDuration: number;
  interruptionCount: number;
  currentSessionId: string | null;
  sessionsCompleted: number;
  totalFocusMinutesToday: number;
  todaySessions: FocusSessionModel[];
  lastCompletedSession: FocusSessionModel | null;

  setMode: (mode: FocusMode) => void;
  setSelectedDuration: (duration: number) => void;
  toggleTodoSelection: (todoId: string) => void;
  setSelectedTodoIds: (ids: string[]) => void;
  setFaceDownEnabled: (enabled: boolean) => void;
  startSession: (sessionId: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  tick: () => void;
  completeSession: (points: number) => void;
  abandonSession: () => void;
  interruptSession: () => void;
  resetSession: () => void;
};

const generateId = () => `focus_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useFocusStore = create<FocusState>((set, get) => ({
  mode: "focus",
  sessionStatus: "idle",
  selectedTodoIds: [],
  selectedDuration: 25,
  remainingSeconds: 25 * 60,
  faceDownEnabled: false,
  pauseCount: 0,
  totalPauseDuration: 0,
  interruptionCount: 0,
  currentSessionId: null,
  sessionsCompleted: 0,
  totalFocusMinutesToday: 0,
  todaySessions: [],
  lastCompletedSession: null,

  setMode: (mode) => set({ mode }),

  setSelectedDuration: (duration) =>
    set({
      selectedDuration: duration,
      remainingSeconds: duration * 60,
    }),

  toggleTodoSelection: (todoId) => {
    const current = get().selectedTodoIds;
    const exists = current.includes(todoId);
    set({
      selectedTodoIds: exists
        ? current.filter((id) => id !== todoId)
        : [...current, todoId],
    });
  },

  setSelectedTodoIds: (ids) => set({ selectedTodoIds: ids }),

  setFaceDownEnabled: (enabled) => set({ faceDownEnabled: enabled }),

  startSession: (sessionId) =>
    set({
      sessionStatus: "active",
      currentSessionId: sessionId,
      remainingSeconds: get().selectedDuration * 60,
      pauseCount: 0,
      totalPauseDuration: 0,
      interruptionCount: 0,
      lastCompletedSession: null,
    }),

  pauseSession: () => {
    const { pauseCount } = get();
    if (pauseCount >= 2) return;
    set({ sessionStatus: "paused", pauseCount: pauseCount + 1 });
  },

  resumeSession: () => set({ sessionStatus: "active" }),

  tick: () => {
    const { remainingSeconds, sessionStatus } = get();
    if (sessionStatus !== "active") return;
    if (remainingSeconds <= 0) return;
    set({ remainingSeconds: remainingSeconds - 1 });
  },

  completeSession: (points) => {
    const state = get();
    const elapsedSeconds = state.selectedDuration * 60 - state.remainingSeconds;
    const session: FocusSessionModel = {
      id: state.currentSessionId ?? generateId(),
      selectedTodoIds: state.selectedTodoIds,
      duration: state.selectedDuration,
      startedAt: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      status: "completed",
      faceDownEnabled: state.faceDownEnabled,
      pauseCount: state.pauseCount,
      totalPauseDuration: state.totalPauseDuration,
      pointsAwarded: points,
      interruptionCount: state.interruptionCount,
    };

    set({
      sessionStatus: "completed",
      lastCompletedSession: session,
      sessionsCompleted: state.sessionsCompleted + 1,
      totalFocusMinutesToday: state.totalFocusMinutesToday + state.selectedDuration,
      todaySessions: [...state.todaySessions, session],
    });
  },

  abandonSession: () => set({ sessionStatus: "abandoned" }),

  interruptSession: () => {
    set((s) => ({
      interruptionCount: s.interruptionCount + 1,
      sessionStatus: "paused",
    }));
  },

  resetSession: () =>
    set({
      sessionStatus: "idle",
      selectedTodoIds: [],
      remainingSeconds: get().selectedDuration * 60,
      currentSessionId: null,
      pauseCount: 0,
      totalPauseDuration: 0,
      interruptionCount: 0,
    }),
}));
