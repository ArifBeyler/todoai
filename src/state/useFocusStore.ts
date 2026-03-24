import { create } from "zustand";

export type FocusMode = "focus" | "shortBreak" | "longBreak";

type FocusSession = {
  id: string;
  duration: number;
  completedAt: string;
};

type FocusState = {
  mode: FocusMode;
  isRunning: boolean;
  selectedDuration: number;
  remainingSeconds: number;
  sessionsCompleted: number;
  totalFocusMinutesToday: number;
  todaySessions: FocusSession[];
  setMode: (mode: FocusMode) => void;
  setSelectedDuration: (minutes: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  completeSession: () => void;
};

const DURATION_BY_MODE: Record<FocusMode, number> = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
};

export const useFocusStore = create<FocusState>((set, get) => ({
  mode: "focus",
  isRunning: false,
  selectedDuration: 25,
  remainingSeconds: 25 * 60,
  sessionsCompleted: 0,
  totalFocusMinutesToday: 0,
  todaySessions: [],

  setMode: (mode) => {
    const duration = DURATION_BY_MODE[mode];
    set({
      mode,
      selectedDuration: duration,
      remainingSeconds: duration * 60,
      isRunning: false,
    });
  },

  setSelectedDuration: (minutes) => {
    set({
      selectedDuration: minutes,
      remainingSeconds: minutes * 60,
      isRunning: false,
      mode: "focus",
    });
  },

  start: () => set({ isRunning: true }),
  pause: () => set({ isRunning: false }),

  reset: () => {
    const { selectedDuration } = get();
    set({
      remainingSeconds: selectedDuration * 60,
      isRunning: false,
    });
  },

  tick: () => {
    const { remainingSeconds, isRunning } = get();
    if (!isRunning || remainingSeconds <= 0) return;
    if (remainingSeconds === 1) {
      get().completeSession();
      return;
    }
    set({ remainingSeconds: remainingSeconds - 1 });
  },

  completeSession: () => {
    const { mode, selectedDuration, sessionsCompleted } = get();
    const isFocusMode = mode === "focus";
    const newSessionsCompleted = isFocusMode ? sessionsCompleted + 1 : sessionsCompleted;

    const session: FocusSession = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      duration: selectedDuration,
      completedAt: new Date().toISOString(),
    };

    const nextMode: FocusMode = !isFocusMode
      ? "focus"
      : newSessionsCompleted % 4 === 0
        ? "longBreak"
        : "shortBreak";

    const nextDuration = DURATION_BY_MODE[nextMode];

    set((state) => ({
      isRunning: false,
      sessionsCompleted: newSessionsCompleted,
      totalFocusMinutesToday: isFocusMode
        ? state.totalFocusMinutesToday + selectedDuration
        : state.totalFocusMinutesToday,
      todaySessions: isFocusMode ? [...state.todaySessions, session] : state.todaySessions,
      mode: nextMode,
      selectedDuration: nextDuration,
      remainingSeconds: nextDuration * 60,
    }));
  },
}));
