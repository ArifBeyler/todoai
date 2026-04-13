import { create } from "zustand";

export type TodoVisualStatus = "idle" | "pending" | "ready" | "failed";

export type TodoItemModel = {
  id: string;
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
  recurrence: "once" | "daily" | "weekly" | "weekend";
  isCompleted: boolean;
  createdAt: string;
  visualUrl: string | null;
  visualStatus: TodoVisualStatus;
};

export type VisualModel = {
  id: string;
  imageUrl: string;
  styleUsed: string;
  promptUsed: string;
  todoIds: string[];
  createdAt: string;
};

type AddTodoPayload = {
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
  recurrence: "once" | "daily" | "weekly" | "weekend";
};

type TodoState = {
  todos: TodoItemModel[];
  visuals: VisualModel[];
  latestVisual: VisualModel | null;
  isGenerating: boolean;
  generationError: string | null;
  dailyGenerationCount: number;
  dailyGenerationDate: string | null;

  addTodo: (payload: AddTodoPayload) => void;
  removeTodo: (id: string) => void;
  updateTodo: (id: string, patch: Partial<TodoItemModel>) => void;
  toggleTodo: (id: string) => void;
  clearGenerationError: () => void;
  setTodoVisualStatus: (
    todoId: string,
    status: TodoVisualStatus,
    url?: string,
  ) => void;
  incrementDailyGeneration: () => void;
};

const randomId = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const todayStr = () => new Date().toISOString().slice(0, 10);

const DAILY_GENERATION_CAP = 5;
export const MIN_TODOS_FOR_GENERATION = 3;

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  visuals: [],
  latestVisual: null,
  isGenerating: false,
  generationError: null,
  dailyGenerationCount: 0,
  dailyGenerationDate: null,

  addTodo: (payload) =>
    set((state) => ({
      todos: [
        {
          id: randomId(),
          title: payload.title,
          category: payload.category,
          priority: payload.priority,
          recurrence: payload.recurrence,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          visualUrl: null,
          visualStatus: "idle",
        },
        ...state.todos,
      ],
    })),

  removeTodo: (id) =>
    set((state) => ({
      todos: state.todos.filter((item) => item.id !== id),
    })),

  updateTodo: (id, patch) =>
    set((state) => ({
      todos: state.todos.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    })),

  toggleTodo: (id) =>
    set((state) => ({
      todos: state.todos.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item,
      ),
    })),

  clearGenerationError: () => set({ generationError: null }),

  setTodoVisualStatus: (todoId, status, url) =>
    set((state) => ({
      todos: state.todos.map((item) =>
        item.id === todoId
          ? {
              ...item,
              visualStatus: status,
              visualUrl: url ?? item.visualUrl,
            }
          : item,
      ),
    })),

  incrementDailyGeneration: () =>
    set((state) => {
      const today = todayStr();
      if (state.dailyGenerationDate !== today) {
        return { dailyGenerationCount: 1, dailyGenerationDate: today };
      }
      return { dailyGenerationCount: state.dailyGenerationCount + 1 };
    }),
}));

export const getCurrentHeroTodo = (
  todos: TodoItemModel[],
): TodoItemModel | null => {
  const withVisual = todos.find(
    (t) => !t.isCompleted && t.visualStatus === "ready",
  );
  if (withVisual) return withVisual;

  const pending = todos.find(
    (t) => !t.isCompleted && t.visualStatus === "pending",
  );
  if (pending) return pending;

  return todos.find((t) => !t.isCompleted) ?? null;
};

export const getTodosNeedingVisuals = (
  todos: TodoItemModel[],
): TodoItemModel[] =>
  todos.filter((t) => !t.isCompleted && t.visualStatus === "idle");

export const canGenerateMore = (state: {
  dailyGenerationCount: number;
  dailyGenerationDate: string | null;
}): boolean => {
  const today = todayStr();
  if (state.dailyGenerationDate !== today) return true;
  return state.dailyGenerationCount < DAILY_GENERATION_CAP;
};
