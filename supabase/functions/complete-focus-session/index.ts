import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, json, badRequest, methodNotAllowed, serverError } from "../_shared/http.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { trackBackendEvent } from "../_shared/analytics.ts";

type CompleteFocusBody = {
  sessionId: string;
  status: "completed" | "abandoned" | "interrupted";
  actualDurationSeconds: number;
  pauseCount: number;
  totalPauseSeconds: number;
  interruptionCount: number;
  faceDownEnabled: boolean;
  todoIds: string[];
  durationMinutes: number;
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const { user, response: authError } = await getUserFromRequest(request);
  if (authError) return authError;
  if (!user) return json({ error: "unauthorized" }, 401);

  try {
    const body: CompleteFocusBody = await request.json();

    if (!body.sessionId) return badRequest("sessionId required");

    const completedAt = new Date().toISOString();
    const isCompleted = body.status === "completed";
    const completedEnough = body.actualDurationSeconds >= (body.durationMinutes * 60 * 0.5);

    let pointsAwarded = 0;

    if (isCompleted || completedEnough) {
      const { data: points, error: rpcError } = await adminClient.rpc("award_focus_points", {
        p_user_id: user.id,
        p_session_id: body.sessionId,
        p_duration_minutes: body.durationMinutes,
        p_face_down: body.faceDownEnabled && body.interruptionCount === 0,
        p_pause_count: body.pauseCount,
      });

      if (rpcError) {
        console.error("award_focus_points error:", rpcError);
      } else {
        pointsAwarded = points ?? 0;
      }
    }

    const { error: updateError } = await adminClient
      .from("focus_sessions")
      .update({
        status: body.status,
        actual_duration_seconds: body.actualDurationSeconds,
        pause_count: body.pauseCount,
        total_pause_seconds: body.totalPauseSeconds,
        interruption_count: body.interruptionCount,
        points_awarded: pointsAwarded,
        completed_at: completedAt,
      })
      .eq("id", body.sessionId)
      .eq("user_id", user.id);

    if (updateError) return serverError("session_update_failed", updateError.message);

    await trackBackendEvent(user.id, `focus_session_${body.status}`, {
      sessionId: body.sessionId,
      durationMinutes: body.durationMinutes,
      actualDurationSeconds: body.actualDurationSeconds,
      faceDown: body.faceDownEnabled,
      points: pointsAwarded,
      todoCount: body.todoIds.length,
    });

    const { data: userData } = await adminClient
      .from("users")
      .select("total_points, focus_streak")
      .eq("id", user.id)
      .single();

    return json({
      status: body.status,
      pointsAwarded,
      totalPoints: userData?.total_points ?? 0,
      focusStreak: userData?.focus_streak ?? 0,
    });
  } catch (err) {
    return serverError("complete_focus_session_failed", String(err));
  }
});
