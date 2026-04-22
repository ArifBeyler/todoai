import { useCallback, useEffect, useRef } from "react";
import { useSessionStore } from "@state/useSessionStore";
import {
  useTodoStore,
  getTodosNeedingVisuals,
  getEligibleTodos,
  getCurrentHeroTodo,
  canGenerateMore,
  MIN_TODOS_FOR_GENERATION,
  type TodoItemModel,
} from "@state/useTodoStore";
import { generateTodoVisual } from "@/src/services/falService";
import { supabase } from "@/src/services/supabase";

const __DEV_LOG = __DEV__
  ? (...args: unknown[]) => console.log("[VisualGen]", ...args)
  : () => {};

const resolveImageUrl = async (url: string): Promise<string> => {
  if (url.startsWith("http")) return url;
  const { data: signed } = await supabase.storage
    .from("daily-visuals-private")
    .createSignedUrl(url, 3600);
  return signed?.signedUrl ?? url;
};

export const useTodoVisualGeneration = () => {
  const processingRef = useRef<Set<string>>(new Set());
  // Locks the outer batch orchestrator. Without this two simultaneous effects
  // could try to start two batches and double-fire generation.
  const batchRunningRef = useRef(false);
  // Ref-based snapshot of generationBatch so status checks don't recreate the
  // triggerPendingGenerations callback (which would cause an infinite loop when
  // resetGenerationBatch() flips status back to "idle").
  const generationBatchRef = useRef(
    useTodoStore.getState().generationBatch,
  );

  const todos = useTodoStore((s) => s.todos);
  const setTodoVisualStatus = useTodoStore((s) => s.setTodoVisualStatus);
  const incrementDailyGeneration = useTodoStore(
    (s) => s.incrementDailyGeneration,
  );
  const dailyGenerationCount = useTodoStore((s) => s.dailyGenerationCount);
  const dailyGenerationDate = useTodoStore((s) => s.dailyGenerationDate);
  const generationBatch = useTodoStore((s) => s.generationBatch);

  // Keep the ref in sync so triggerPendingGenerations can read the latest
  // status without depending on it as a reactive value (avoids infinite loops).
  generationBatchRef.current = generationBatch;
  const startGenerationBatch = useTodoStore((s) => s.startGenerationBatch);
  const setGenerationCurrentTodo = useTodoStore(
    (s) => s.setGenerationCurrentTodo,
  );
  const incrementGenerationProgress = useTodoStore(
    (s) => s.incrementGenerationProgress,
  );
  const finishGenerationBatch = useTodoStore((s) => s.finishGenerationBatch);
  const resetGenerationBatch = useTodoStore((s) => s.resetGenerationBatch);

  // On mount: clean up any persisted state that would silently block generation.
  useEffect(() => {
    const { generationBatch: batch, todos: currentTodos } =
      useTodoStore.getState();
    const setStatus = useTodoStore.getState().setTodoVisualStatus;

    if (batch.status === "running" || batch.status === "error") {
      __DEV_LOG(`Stale batch '${batch.status}' on mount → resetting`);
      batchRunningRef.current = false;
      resetGenerationBatch();
      // Restore "pending" todos stuck from a killed app run.
      currentTodos
        .filter((t) => t.visualStatus === "pending" && t.deletedAt == null)
        .forEach((t) => setStatus(t.id, "idle"));
    }

    // Todos that "failed" in a previous session (likely due to the 401 session-
    // timing bug that is now fixed) deserve a fresh attempt. Only do this when
    // the batch itself is idle/done — never if it's still running or in error.
    if (batch.status === "idle" || batch.status === "done") {
      currentTodos
        .filter((t) => t.visualStatus === "failed" && t.deletedAt == null)
        .forEach((t) => setStatus(t.id, "idle"));
    }

    // Intentionally empty deps — run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { stylePreference, profilePhoto } = useSessionStore();

  const currentHeroTodo = getCurrentHeroTodo(todos);

  const generateForTodo = useCallback(
    async (todo: TodoItemModel): Promise<"success" | "failed" | "skipped"> => {
      if (processingRef.current.has(todo.id)) return "skipped";

      // The edge function expects the backend-assigned Supabase UUID. If it
      // hasn't been assigned yet (async create-task hasn't returned), skip and
      // let the retry timer pick it up once the ID is available.
      const backendId = todo.backendId;
      if (!backendId) {
        return "skipped";
      }

      // enqueue-daily-visual has verify_jwt: true — the gateway rejects requests
      // without a valid user session token. Guard here so we never fire the call
      // before the session has been hydrated from AsyncStorage.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        __DEV_LOG(`skip "${todo.title}": session not ready`);
        return "skipped";
      }

      processingRef.current.add(todo.id);
      setTodoVisualStatus(todo.id, "pending");

      try {
        const rawUrl = await generateTodoVisual({
          todoId: backendId,
          todoTitle: todo.title,
          style: stylePreference,
          profilePhoto,
        });

        const resolvedUrl = await resolveImageUrl(rawUrl);
        setTodoVisualStatus(todo.id, "ready", resolvedUrl);
        incrementDailyGeneration();
        __DEV_LOG(`✅ "${todo.title}"`);
        return "success";
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        __DEV_LOG(`❌ "${todo.title}":`, msg);
        if (msg === "daily_cap_reached" || msg === "auth_required") {
          // Transient — leave idle so the next session/retry can pick it up.
          setTodoVisualStatus(todo.id, "idle");
          return "skipped";
        }
        if (msg === "premium_required" || msg === "avatar_required") {
          // Permanent for this session — mark failed so we don't loop endlessly.
          // The user must upgrade / generate an avatar before retrying.
          setTodoVisualStatus(todo.id, "failed");
          return "failed";
        }
        setTodoVisualStatus(todo.id, "failed");
        return "failed";
      } finally {
        processingRef.current.delete(todo.id);
      }
    },
    [stylePreference, profilePhoto, setTodoVisualStatus, incrementDailyGeneration],
  );

  const runBatch = useCallback(
    async (targets: TodoItemModel[]) => {
      if (batchRunningRef.current) return;
      if (targets.length === 0) return;

      batchRunningRef.current = true;
      startGenerationBatch(targets.map((t) => t.id));

      let failed = false;
      let anyAttempted = false;

      for (const todo of targets) {
        if (!canGenerateMore({ dailyGenerationCount, dailyGenerationDate })) {
          failed = true;
          break;
        }
        setGenerationCurrentTodo(todo.id);
        const result = await generateForTodo(todo);
        if (result === "success") {
          anyAttempted = true;
          incrementGenerationProgress();
        } else if (result === "failed") {
          anyAttempted = true;
          failed = true;
          incrementGenerationProgress();
        }
        // "skipped" → todo stays idle, not counted as attempted
      }

      setGenerationCurrentTodo(null);

      if (!anyAttempted) {
        // Nothing was sent to the backend (session not ready / no backendIds).
        // Mark as "error" so triggerPendingGenerations won't re-fire the loop.
        // onAuthStateChange will explicitly reset + retry once session is ready.
        finishGenerationBatch("error");
      } else {
        finishGenerationBatch(failed ? "error" : "done");
      }

      batchRunningRef.current = false;
    },
    [
      dailyGenerationCount,
      dailyGenerationDate,
      generateForTodo,
      startGenerationBatch,
      setGenerationCurrentTodo,
      incrementGenerationProgress,
      finishGenerationBatch,
    ],
  );

  const triggerPendingGenerations = useCallback(() => {
    if (batchRunningRef.current) return;
    // Use the ref so this callback is NOT recreated when batch status changes —
    // that would cause an infinite loop (status change → new callback → useEffect
    // fires → triggerPendingGenerations → startBatch → status change → …).
    const batchStatus = generationBatchRef.current.status;
    if (batchStatus === "running" || batchStatus === "error") return;

    const eligible = getEligibleTodos(todos);
    if (eligible.length < MIN_TODOS_FOR_GENERATION) return;

    const needingVisuals = getTodosNeedingVisuals(todos);
    if (needingVisuals.length === 0) return;

    if (!canGenerateMore({ dailyGenerationCount, dailyGenerationDate })) return;

    __DEV_LOG(`batch start · ${needingVisuals.length} todos`);
    void runBatch(needingVisuals);
  }, [
    todos,
    dailyGenerationCount,
    dailyGenerationDate,
    // generationBatch.status intentionally omitted — use generationBatchRef
    runBatch,
  ]);

  // Two-pass effect: run the trigger check, then schedule retries.
  // The retries protect against the async backendId assignment race: create-task
  // may not have returned before the third todo triggers this effect, so we
  // re-check after short intervals to catch todos whose backendId just arrived.
  useEffect(() => {
    triggerPendingGenerations();
    const t1 = setTimeout(triggerPendingGenerations, 800);
    const t2 = setTimeout(triggerPendingGenerations, 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [triggerPendingGenerations]);

  // Session-gate: enqueue-daily-visual and create-task both require verify_jwt:
  // true. If they fire before the Supabase session is hydrated from AsyncStorage
  // (commonly within the first ~1s), they return 401 and backendId stays null.
  // Subscribe to auth state so we can:
  //  1. Sync any todos whose backendId wasn't assigned (create-task 401'd)
  //  2. Trigger visual generation once backendIds are available
  useEffect(() => {
    const syncMissingBackendIds = async () => {
      const { todos: currentTodos } = useTodoStore.getState();
      const unsynced = currentTodos.filter(
        (t) => !t.backendId && t.deletedAt == null,
      );
      if (unsynced.length === 0) return;

      __DEV_LOG(`syncing ${unsynced.length} todos missing backendId`);
      for (const todo of unsynced) {
        try {
          const { data, error } = await supabase.functions.invoke(
            "create-task",
            {
              body: {
                title: todo.title,
                kind: todo.recurrence === "once" ? "task" : "habit",
                category: todo.category,
                priority: todo.priority,
                recurrence: todo.recurrence,
              },
            },
          );
          if (!error && data?.task?.id) {
            useTodoStore.getState().updateTodo(todo.id, {
              backendId: data.task.id,
            });
            __DEV_LOG(`synced "${todo.title}" → ${data.task.id}`);
          } else if (error) {
            __DEV_LOG(`create-task error for "${todo.title}":`, error.message ?? error);
          }
        } catch (e) {
          __DEV_LOG(`create-task exception for "${todo.title}":`, e instanceof Error ? e.message : e);
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
        // First assign backendIds, then attempt visual generation.
        await syncMissingBackendIds();
        // If the batch is stuck in "error" (caused by skipping all todos due to
        // missing session), reset it so triggerPendingGenerations can proceed.
        if (useTodoStore.getState().generationBatch.status === "error") {
          useTodoStore.getState().resetGenerationBatch();
        }
        setTimeout(triggerPendingGenerations, 300);
      }
    });
    return () => subscription.unsubscribe();
  }, [triggerPendingGenerations]);

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
        void generateForTodo(next);
      }
    },
    [todos, dailyGenerationCount, dailyGenerationDate, generateForTodo],
  );

  return {
    currentHeroTodo,
    triggerPendingGenerations,
    handleTodoCompleted,
    generationBatch,
  };
};
