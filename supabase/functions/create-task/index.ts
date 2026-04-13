import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { badRequest, corsHeaders, json, methodNotAllowed, serverError } from "../_shared/http.ts";

type CreateTaskBody = {
  title: string;
  kind?: "task" | "habit";
  category?: string;
  priority?: string;
  dueDate?: string;
  recurrence?: string;
  recurrenceRule?: Record<string, unknown>;
  notes?: string;
  reminderEnabled?: boolean;
  reminderTime?: string;
  goalId?: string;
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const { client, user, response } = await getUserFromRequest(request);
  if (response || !client || !user) return response;

  let body: CreateTaskBody;
  try {
    body = await request.json();
  } catch {
    return badRequest("invalid_json");
  }

  if (!body.title || body.title.trim().length === 0) {
    return badRequest("title_required");
  }

  const kind = body.kind ?? "task";
  if (!["task", "habit"].includes(kind)) {
    return badRequest("invalid_kind");
  }

  try {
    const { data: task, error: taskError } = await client
      .from("todos")
      .insert({
        user_id: user.id,
        title: body.title.trim(),
        kind,
        category: body.category ?? "personal",
        priority: body.priority ?? "medium",
        due_date: body.dueDate ?? null,
        recurrence: body.recurrence ?? (kind === "habit" ? "daily" : "once"),
        recurrence_rule: body.recurrenceRule ?? null,
        notes: body.notes ?? null,
        reminder_enabled: body.reminderEnabled ?? false,
        reminder_time: body.reminderTime ?? null,
        goal_id: body.goalId ?? null,
        is_completed: false,
        is_archived: false,
      })
      .select("id, title, kind, category, priority, due_date, recurrence, created_at")
      .single();

    if (taskError) return serverError("task_create_failed", taskError.message);

    // Create today's instance for task or habit
    const today = new Date().toISOString().slice(0, 10);
    await adminClient.from("task_instances").insert({
      task_id: task.id,
      user_id: user.id,
      scheduled_for_date: today,
      status: "scheduled",
    });

    // Refresh daily stats
    await adminClient.rpc("refresh_daily_stats", {
      p_user_id: user.id,
      p_date: today,
    });

    return json({ status: "created", task });
  } catch (error) {
    return serverError("create_task_error", String(error));
  }
});
