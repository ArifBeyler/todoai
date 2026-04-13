import { useCallback, useEffect, useRef } from "react";
import { useSessionStore } from "@state/useSessionStore";
import {
  useTodoStore,
  getTodosNeedingVisuals,
  getCurrentHeroTodo,
  canGenerateMore,
  MIN_TODOS_FOR_GENERATION,
  type TodoItemModel,
} from "@state/useTodoStore";
import { generateTodoVisual } from "@/src/services/falService";
import { supabase } from "@/src/services/supabase";

const resolveImageUrl = async (url: string): Promise<string> => {
  if (url.startsWith("http")) return url;
  const { data: signed } = await supabase.storage
    .from("daily-visuals-private")
    .createSignedUrl(url, 3600);
  return signed?.signedUrl ?? url;
};

export const useTodoVisualGeneration = () => {
  const processingRef = useRef<Set<string>>(new Set());

  const todos = useTodoStore((s) => s.todos);
  const setTodoVisualStatus = useTodoStore((s) => s.setTodoVisualStatus);
  const incrementDailyGeneration = useTodoStore(
    (s) => s.incrementDailyGeneration,
  );
  const dailyGenerationCount = useTodoStore((s) => s.dailyGenerationCount);
  const dailyGenerationDate = useTodoStore((s) => s.dailyGenerationDate);

  const { stylePreference, profilePhoto } = useSessionStore();

  const currentHeroTodo = getCurrentHeroTodo(todos);

  // Filter out soft-deleted todos from visual generation candidates
  const generateForTodo = useCallback(
    async (todo: TodoItemModel) => {
      if (processingRef.current.has(todo.id)) return;
      processingRef.current.add(todo.id);

      setTodoVisualStatus(todo.id, "pending");

      try {
        const rawUrl = await generateTodoVisual({
          todoId: todo.id,
          todoTitle: todo.title,
          style: stylePreference,
          profilePhoto,
        });

        const resolvedUrl = await resolveImageUrl(rawUrl);
        setTodoVisualStatus(todo.id, "ready", resolvedUrl);
        incrementDailyGeneration();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg === "daily_cap_reached") {
          setTodoVisualStatus(todo.id, "idle");
        } else {
          setTodoVisualStatus(todo.id, "failed");
        }
      } finally {
        processingRef.current.delete(todo.id);
      }
    },
    [
      stylePreference,
      profilePhoto,
      setTodoVisualStatus,
      incrementDailyGeneration,
    ],
  );

  const triggerPendingGenerations = useCallback(() => {
    const activeTodosCount = todos.filter(
      (t) => t.deletedAt == null && !t.isCompleted,
    ).length;
    if (activeTodosCount < MIN_TODOS_FOR_GENERATION) return;
    if (!canGenerateMore({ dailyGenerationCount, dailyGenerationDate })) return;

    const needingVisuals = getTodosNeedingVisuals(todos);
    if (needingVisuals.length === 0) return;

    const first = needingVisuals[0];
    if (!processingRef.current.has(first.id)) {
      generateForTodo(first);
    }
  }, [todos, dailyGenerationCount, dailyGenerationDate, generateForTodo]);

  useEffect(() => {
    triggerPendingGenerations();
  }, [todos.length, triggerPendingGenerations]);

  const handleTodoCompleted = useCallback(
    (completedTodoId: string) => {
      const remaining = todos.filter(
        (t) => t.deletedAt == null && !t.isCompleted && t.id !== completedTodoId,
      );
      const next = remaining.find((t) => t.visualStatus === "idle");
      if (
        next &&
        canGenerateMore({ dailyGenerationCount, dailyGenerationDate })
      ) {
        generateForTodo(next);
      }
    },
    [todos, dailyGenerationCount, dailyGenerationDate, generateForTodo],
  );

  return {
    currentHeroTodo,
    triggerPendingGenerations,
    handleTodoCompleted,
  };
};
