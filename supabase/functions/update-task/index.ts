import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { badRequest, corsHeaders, json, methodNotAllowed, serverError } from "../_shared/http.ts";

type UpdateTaskBody = {
  id: string;
  title?: string;
  category?: string;
  priority?: string;
  dueDate?: string | null;
  recurrence?: string;
  recurrenceRule?: Record<string, unknown> | null;
  notes?: string | null;
  reminderEnabled?: boolean;
  reminderTime?: string | null;
  isArchived?: boolean;
  goalId?: string | null;
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const { client, user, response } = await getUserFromRequest(request);
  if (response || !client || !user) return response;

  let body: UpdateTaskBody;
  try {
    body = await request.json();
  } catch {
    return badRequest("invalid_json");
  }

  if (!body.id) return badRequest("id_required");

  const updateFields: Record<string, unknown> = {};
  if (body.title !== undefined) updateFields.title = body.title.trim();
  if (body.category !== undefined) updateFields.category = body.category;
  if (body.priority !== undefined) updateFields.priority = body.priority;
  if (body.dueDate !== undefined) updateFields.due_date = body.dueDate;
  if (body.recurrence !== undefined) updateFields.recurrence = body.recurrence;
  if (body.recurrenceRule !== undefined) updateFields.recurrence_rule = body.recurrenceRule;
  if (body.notes !== undefined) updateFields.notes = body.notes;
  if (body.reminderEnabled !== undefined) updateFields.reminder_enabled = body.reminderEnabled;
  if (body.reminderTime !== undefined) updateFields.reminder_time = body.reminderTime;
  if (body.isArchived !== undefined) updateFields.is_archived = body.isArchived;
  if (body.goalId !== undefined) updateFields.goal_id = body.goalId;

  if (Object.keys(updateFields).length === 0) {
    return badRequest("no_fields_to_update");
  }

  try {
    const { data: task, error } = await client
      .from("todos")
      .update(updateFields)
      .eq("id", body.id)
      .eq("user_id", user.id)
      .select("id, title, kind, category, priority, due_date, recurrence, is_archived, updated_at")
      .single();

    if (error) return serverError("task_update_failed", error.message);
    if (!task) return json({ error: "not_found" }, 404);

    return json({ status: "updated", task });
  } catch (error) {
    return serverError("update_task_error", String(error));
  }
});
