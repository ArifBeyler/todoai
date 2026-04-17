import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/src/services/supabase";

export type TodoVisualStatus = "idle" | "pending" | "ready" | "failed";

export type Recurrence = "once" | "daily" | "weekly" | "weekend" | "weekdays" | "custom";

export type TodoItemModel = {
  id: string;
  /** Supabase UUID assigned after syncing with the backend. Used for edge function calls. */
  backendId?: string;
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
  recurrence: Recurrence;
  recurrenceDays?: number[];
  customDates?: string[];
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  deletedAt: string | null;
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
  recurrence: Recurrence;
  recurrenceDays?: number[];
  customDates?: string[];
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

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      todos: [],
      visuals: [],
      latestVisual: null,
      isGenerating: false,
      generationError: null,
      dailyGenerationCount: 0,
      dailyGenerationDate: null,

      addTodo: (payload) => {
        const localId = randomId();
        const now = new Date().toISOString();
        set((state) => ({
          todos: [
            {
              id: localId,
              title: payload.title,
              category: payload.category,
              priority: payload.priority,
              recurrence: payload.recurrence,
              recurrenceDays: payload.recurrenceDays,
              customDates: payload.customDates,
              isCompleted: false,
              createdAt: now,
              updatedAt: now,
              completedAt: null,
              deletedAt: null,
              visualUrl: null,
              visualStatus: "idle",
            },
            ...state.todos,
          ],
        }));

        // Fire-and-forget backend sync: update the local todo with the assigned backendId on success
        supabase.functions
          .invoke("create-task", {
            body: {
              title: payload.title,
              kind: payload.recurrence === "once" ? "task" : "habit",
              category: payload.category,
              priority: payload.priority,
              recurrence: payload.recurrence,
            },
          })
          .then(({ data, error }) => {
            if (!error && data?.task?.id) {
              set((state) => ({
                todos: state.todos.map((t) =>
                  t.id === localId ? { ...t, backendId: data.task.id } : t,
                ),
              }));
            } else if (__DEV__ && error) {
              console.warn("[useTodoStore] addTodo backend sync failed:", error.message);
            }
          })
          .catch(() => {
            // Silent fail — local state is source of truth; sync will re-attempt on next load
          });
      },

      // Soft delete: sets deletedAt timestamp instead of removing from array.
      // This preserves history for snapshot validation and eligibility stability checks.
      removeTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((item) =>
            item.id === id
              ? { ...item, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : item,
          ),
        })),

      updateTodo: (id, patch) =>
        set((state) => ({
          todos: state.todos.map((item) =>
            item.id === id
              ? { ...item, ...patch, updatedAt: new Date().toISOString() }
              : item,
          ),
        })),

      toggleTodo: (id) => {
        const current = get().todos.find((t) => t.id === id);
        const completing = current ? !current.isCompleted : false;

        set((state) => ({
          todos: state.todos.map((item) => {
            if (item.id !== id) return item;
            return {
              ...item,
              isCompleted: completing,
              completedAt: completing ? new Date().toISOString() : null,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));

        // Sync completion to backend (only when completing, not un-completing)
        if (completing && current?.backendId) {
          supabase.functions
            .invoke("complete-task", {
              body: { taskId: current.backendId },
            })
            .catch(() => {
              // Silent fail — local completion is recorded; backend will self-heal on next app load
            });
        }
      },

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
    }),
    {
      name: "doara-todos",
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted: any, version: number) => {
        if (version < 2) {
          const now = new Date().toISOString();
          return {
            ...persisted,
            todos: (persisted.todos ?? []).map((t: any) => ({
              ...t,
              updatedAt: t.updatedAt ?? t.createdAt ?? now,
              completedAt: t.completedAt ?? (t.isCompleted ? now : null),
              deletedAt: t.deletedAt ?? null,
            })),
          };
        }
        return persisted as TodoState;
      },
    },
  ),
);

// Returns only todos that should appear in UI and counts (active, non-deleted)
export const getActiveTodos = (todos: TodoItemModel[]): TodoItemModel[] =>
  todos.filter((t) => t.deletedAt == null && !t.isCompleted);

// Returns todos eligible for AI visual generation:
// non-deleted, non-completed, with a meaningful title
export const getEligibleTodos = (todos: TodoItemModel[]): TodoItemModel[] =>
  todos.filter(
    (t) =>
      t.deletedAt == null &&
      !t.isCompleted &&
      t.title.trim().length > 0,
  );

export const getCurrentHeroTodo = (
  todos: TodoItemModel[],
): TodoItemModel | null => {
  const active = todos.filter((t) => t.deletedAt == null && !t.isCompleted);
  const withVisual = active.find((t) => t.visualStatus === "ready");
  if (withVisual) return withVisual;

  const pending = active.find((t) => t.visualStatus === "pending");
  if (pending) return pending;

  return active[0] ?? null;
};

export const getTodosNeedingVisuals = (
  todos: TodoItemModel[],
): TodoItemModel[] =>
  todos.filter(
    (t) => t.deletedAt == null && !t.isCompleted && t.visualStatus === "idle",
  );

export const canGenerateMore = (state: {
  dailyGenerationCount: number;
  dailyGenerationDate: string | null;
}): boolean => {
  const today = todayStr();
  if (state.dailyGenerationDate !== today) return true;
  return state.dailyGenerationCount < DAILY_GENERATION_CAP;
};

// Produces a stable hash of eligible todo titles for stale-job detection.
// Changes in title content or count will produce a different hash.
export const hashEligibleTodos = (todos: TodoItemModel[]): string => {
  const eligible = getEligibleTodos(todos);
  const key = eligible
    .map((t) => `${t.id}:${t.title.trim()}`)
    .sort()
    .join("|");
  // Simple djb2-style hash — good enough for change detection
  let h = 5381;
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) + h + key.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
};
