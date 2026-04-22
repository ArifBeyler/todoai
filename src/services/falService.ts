import { supabase } from "./supabase";

type GenerateTodoVisualInput = {
  todoId: string;
  todoTitle: string;
  style: string;
  profilePhoto: string | null;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Task Scene Generation ───────────────────────────────────────────

export const generateTodoVisual = async ({
  todoId,
  todoTitle,
  style,
  profilePhoto,
}: GenerateTodoVisualInput): Promise<string> => {
  const { data: enqueueData, error: enqueueError } =
    await supabase.functions.invoke("enqueue-daily-visual", {
      body: {
        todoId,
        todoTitle,
        jobType: "todo_scene",
        promptVersion: "v2",
        metadata: {
          style,
          hasProfilePhoto: Boolean(profilePhoto),
        },
      },
    });

  if (enqueueError) {
    // Try to get the HTTP status from the Supabase FunctionsHttpError context.
    // This lets callers distinguish "not premium" (403) from real failures.
    const httpStatus: number | undefined = (enqueueError as any)?.context?.status;
    if (httpStatus === 401) throw new Error("auth_required");
    if (httpStatus === 403) throw new Error("premium_required");
    if (httpStatus === 400) {
      // Could be avatar_required or bad params — treat as non-retryable.
      let body: Record<string, unknown> = {};
      try {
        body = await (enqueueError as any)?.context?.json();
      } catch {}
      throw new Error(
        (body?.error as string) ?? "bad_request",
      );
    }
    throw new Error(enqueueError.message ?? "Görsel kuyruğa eklenemedi");
  }

  if (enqueueData?.status === "already_exists" && enqueueData?.imageUrl) {
    return enqueueData.imageUrl;
  }

  if (enqueueData?.status === "daily_cap_reached") {
    throw new Error("daily_cap_reached");
  }

  const jobId = enqueueData?.job?.id ?? enqueueData?.jobId;
  if (!jobId) {
    throw new Error("Job ID alınamadı");
  }

  const maxPolls = 40;
  let pollCount = 0;
  let pollInterval = 3_000;

  while (pollCount < maxPolls) {
    pollCount += 1;
    await sleep(pollInterval);

    const { data, error } = await supabase.functions.invoke("get-home-state", {
      body: {},
    });

    if (error) continue;

    const todoVisuals = data?.todo_visuals as
      | Array<{ todo_id?: string; image_url?: string; status?: string }>
      | undefined;

    const match = todoVisuals?.find(
      (v) => v.todo_id === todoId && v.status === "success" && v.image_url,
    );

    if (match?.image_url) {
      return match.image_url;
    }

    const heroVisual = data?.hero_visual as
      | { image_url?: string; status?: string; todo_id?: string }
      | undefined;

    if (
      heroVisual?.todo_id === todoId &&
      heroVisual?.status === "success" &&
      heroVisual?.image_url
    ) {
      return heroVisual.image_url;
    }

    pollInterval = Math.min(pollInterval * 1.2, 8_000);
  }

  throw new Error("Görsel üretimi zaman aşımına uğradı");
};

