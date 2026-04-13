import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient } from "../_shared/supabase.ts";
import { corsHeaders, json, methodNotAllowed, serverError } from "../_shared/http.ts";
import { trackBackendEvent } from "../_shared/analytics.ts";

const CRON_SECRET = Deno.env.get("CRON_SECRET");

const MAX_DAILY_NOTIFICATIONS = 5;
const MIN_GAP_MINUTES = 90;
const CATEGORY_LIMITS: Record<string, number> = {
  task_reminder: 2,
  ai_suggestion: 1,
  focus_nudge: 1,
  summary: 1,
  visual_ready: 2,
  achievement: 1,
};

type UserRow = {
  id: string;
  display_name: string | null;
  name: string;
  timezone: string | null;
};

type TodoRow = {
  id: string;
  title: string;
  category: string;
  priority: string;
  reminder_enabled: boolean;
  reminder_time: string | null;
  due_date: string | null;
  is_completed: boolean;
  user_id: string;
};

type PrefsRow = {
  user_id: string;
  reminder_default_time: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
  active_hours_start: string;
  active_hours_end: string;
  notification_categories: Record<string, boolean>;
  daily_notification_limit: number;
};

const isWithinTimeRange = (
  currentTime: string,
  start: string,
  end: string,
): boolean => {
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }
  return currentTime >= start && currentTime < end;
};

const classifyTodoTone = (title: string, isActiveHours: boolean): string => {
  const warmPatterns = /köpek|kedi|anne|baba|arkadaş|sevgili|aile|mama/i;
  const energeticPatterns = /spor|egzersiz|koşu|antrenman|fitness/i;

  if (warmPatterns.test(title)) return "warm";
  if (energeticPatterns.test(title)) return "energetic";
  if (!isActiveHours) return "calm";
  return "focused";
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  if (CRON_SECRET && request.headers.get("x-cron-secret") !== CRON_SECRET) {
    return json({ error: "unauthorized" }, 401);
  }

  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 15 * 60 * 1000);

    const { data: todos, error: todosError } = await adminClient
      .from("todos")
      .select("id, title, category, priority, reminder_enabled, reminder_time, due_date, is_completed, user_id")
      .eq("is_completed", false)
      .eq("reminder_enabled", true)
      .not("reminder_time", "is", null);

    if (todosError) return serverError("todos_fetch_failed", todosError.message);
    if (!todos || todos.length === 0) return json({ scheduled: 0, skipped: 0 });

    const userIds = [...new Set((todos as TodoRow[]).map((t) => t.user_id))];

    const { data: users } = await adminClient
      .from("users")
      .select("id, display_name, name, timezone")
      .in("id", userIds);

    const { data: prefs } = await adminClient
      .from("user_preferences")
      .select("user_id, reminder_default_time, quiet_hours_start, quiet_hours_end, active_hours_start, active_hours_end, notification_categories, daily_notification_limit")
      .in("user_id", userIds);

    const userMap = new Map<string, UserRow>();
    for (const u of (users ?? []) as UserRow[]) {
      userMap.set(u.id, u);
    }

    const prefsMap = new Map<string, PrefsRow>();
    for (const p of (prefs ?? []) as PrefsRow[]) {
      prefsMap.set(p.user_id, p);
    }

    const { data: todayCounts } = await adminClient
      .from("notification_events")
      .select("user_id, id")
      .in("user_id", userIds)
      .gte("created_at", new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString())
      .in("status", ["queued", "sent"]);

    const dailyCountMap = new Map<string, number>();
    for (const row of todayCounts ?? []) {
      const uid = (row as { user_id: string }).user_id;
      dailyCountMap.set(uid, (dailyCountMap.get(uid) ?? 0) + 1);
    }

    const { data: recentNotifs } = await adminClient
      .from("notification_events")
      .select("user_id, created_at")
      .in("user_id", userIds)
      .in("status", ["queued", "sent"])
      .order("created_at", { ascending: false })
      .limit(userIds.length);

    const lastSentMap = new Map<string, string>();
    for (const row of recentNotifs ?? []) {
      const r = row as { user_id: string; created_at: string };
      if (!lastSentMap.has(r.user_id)) {
        lastSentMap.set(r.user_id, r.created_at);
      }
    }

    const { data: existingSchedules } = await adminClient
      .from("notification_schedules")
      .select("todo_id")
      .in("todo_id", (todos as TodoRow[]).map((t) => t.id))
      .eq("status", "pending");

    const alreadyScheduledTodoIds = new Set(
      (existingSchedules ?? []).map((s: { todo_id: string }) => s.todo_id),
    );

    let scheduled = 0;
    let skipped = 0;

    for (const todo of todos as TodoRow[]) {
      if (alreadyScheduledTodoIds.has(todo.id)) {
        skipped++;
        continue;
      }

      const user = userMap.get(todo.user_id);
      const userPrefs = prefsMap.get(todo.user_id);
      if (!user) { skipped++; continue; }

      const categories = userPrefs?.notification_categories ?? {};
      if (categories.task_reminder === false) { skipped++; continue; }

      const limit = userPrefs?.daily_notification_limit ?? MAX_DAILY_NOTIFICATIONS;
      const todayCount = dailyCountMap.get(todo.user_id) ?? 0;
      if (todayCount >= limit) { skipped++; continue; }

      const lastSent = lastSentMap.get(todo.user_id);
      if (lastSent) {
        const gap = (now.getTime() - new Date(lastSent).getTime()) / (1000 * 60);
        if (gap < MIN_GAP_MINUTES) { skipped++; continue; }
      }

      const tz = user.timezone ?? "UTC";
      const nowLocal = new Date().toLocaleTimeString("en-US", { timeZone: tz, hour12: false });

      const quietStart = userPrefs?.quiet_hours_start ?? "22:00";
      const quietEnd = userPrefs?.quiet_hours_end ?? "07:00";
      if (isWithinTimeRange(nowLocal, quietStart, quietEnd)) {
        skipped++;
        continue;
      }

      const activeStart = userPrefs?.active_hours_start ?? "09:00";
      const activeEnd = userPrefs?.active_hours_end ?? "18:00";
      const isActiveHours = isWithinTimeRange(nowLocal, activeStart, activeEnd);

      const tone = classifyTodoTone(todo.title, isActiveHours);
      const displayName = user.display_name ?? user.name ?? "";

      const reminderTime = todo.reminder_time ?? userPrefs?.reminder_default_time ?? "09:00";

      const scheduledFor = new Date();
      const [hours, minutes] = reminderTime.split(":").map(Number);
      scheduledFor.setHours(hours, minutes, 0, 0);

      if (scheduledFor < now || scheduledFor > windowEnd) {
        skipped++;
        continue;
      }

      await adminClient.from("notification_schedules").insert({
        user_id: todo.user_id,
        category: "task_reminder",
        event_key: "task_reminder",
        scheduled_for: scheduledFor.toISOString(),
        todo_id: todo.id,
        tone,
        template_key: `task_reminder_${tone}`,
        personalization: {
          name: displayName,
          todoTitle: todo.title,
          priority: todo.priority,
        },
        status: "pending",
      });

      await adminClient.from("notification_events").insert({
        user_id: todo.user_id,
        event_key: "task_reminder",
        status: "queued",
        payload: {
          todoId: todo.id,
          todoTitle: todo.title,
          tone,
          name: displayName,
        },
      });

      dailyCountMap.set(todo.user_id, todayCount + 1);
      lastSentMap.set(todo.user_id, now.toISOString());
      scheduled++;
    }

    await trackBackendEvent(null, "notifications_scheduled", {
      scheduled,
      skipped,
      windowMinutes: 15,
    });

    return json({ scheduled, skipped });
  } catch (err) {
    return serverError("schedule_notifications_failed", String(err));
  }
});
