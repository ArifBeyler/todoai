import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { badRequest, corsHeaders, json, methodNotAllowed, serverError } from "../_shared/http.ts";

type CompleteTaskBody = {
  taskId: string;
  instanceId?: string;
  date?: string;
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const { client, user, response } = await getUserFromRequest(request);
  if (response || !client || !user) return response;

  let body: CompleteTaskBody;
  try {
    body = await request.json();
  } catch {
    return badRequest("invalid_json");
  }

  if (!body.taskId) return badRequest("task_id_required");

  const today = body.date ?? new Date().toISOString().slice(0, 10);

  try {
    // Verify task ownership
    const { data: task, error: taskError } = await client
      .from("todos")
      .select("id, kind, is_completed")
      .eq("id", body.taskId)
      .eq("user_id", user.id)
      .single();

    if (taskError || !task) return json({ error: "task_not_found" }, 404);

    // Find or create instance for today
    let instanceId = body.instanceId;
    if (!instanceId) {
      const { data: existing } = await adminClient
        .from("task_instances")
        .select("id")
        .eq("task_id", body.taskId)
        .eq("user_id", user.id)
        .eq("scheduled_for_date", today)
        .maybeSingle();

      if (existing) {
        instanceId = existing.id;
      } else {
        const { data: created } = await adminClient
          .from("task_instances")
          .insert({
            task_id: body.taskId,
            user_id: user.id,
            scheduled_for_date: today,
            status: "scheduled",
          })
          .select("id")
          .single();
        instanceId = created?.id;
      }
    }

    if (!instanceId) return serverError("instance_creation_failed");

    // Check for duplicate completion
    const { data: existingCompletion } = await adminClient
      .from("task_completions")
      .select("id")
      .eq("instance_id", instanceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingCompletion) {
      return json({ status: "already_completed", completionId: existingCompletion.id });
    }

    // Create immutable completion record
    const { data: completion, error: completionError } = await adminClient
      .from("task_completions")
      .insert({
        instance_id: instanceId,
        user_id: user.id,
        source: "manual",
      })
      .select("id, completed_at")
      .single();

    if (completionError) return serverError("completion_failed", completionError.message);

    // Update instance status
    await adminClient
      .from("task_instances")
      .update({ status: "completed" })
      .eq("id", instanceId);

    // Mark the legacy is_completed flag on todos for backward compatibility
    if (task.kind === "task") {
      await client
        .from("todos")
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq("id", body.taskId);
    }

    // Refresh daily stats
    await adminClient.rpc("refresh_daily_stats", {
      p_user_id: user.id,
      p_date: today,
    });

    return json({
      status: "completed",
      completion: { id: completion.id, completedAt: completion.completed_at },
      instanceId,
    });
  } catch (error) {
    return serverError("complete_task_error", String(error));
  }
});
