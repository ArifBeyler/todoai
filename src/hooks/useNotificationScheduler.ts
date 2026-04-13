import { useCallback, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useTodoStore } from "@/src/state/useTodoStore";
import { useSessionStore } from "@/src/state/useSessionStore";
import { classifyTodoMeaning, shouldUseEmoji } from "@/src/utils/classifyTodoMeaning";
import {
  resyncHydrationReminders,
  cancelHydrationReminders,
  delayNextHydrationReminder,
} from "@/src/services/hydrationReminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const buildNotificationContent = (
  todoTitle: string,
  userName: string,
): { title: string; body: string } => {
  const meaning = classifyTodoMeaning(todoTitle);
  const useEmoji = shouldUseEmoji(meaning, "active_hours");
  const emoji = useEmoji ? ` ${meaning.emoji}` : "";

  const templates = [
    { title: "Görev Zamanı!", body: `${userName}, ${todoTitle} için hazırsan başlayalım!${emoji}` },
    { title: "Hatırlatma", body: `${todoTitle} — bugün bunu bitirmek harika olur${emoji}` },
    { title: "Listende", body: `Günün görevi seni bekliyor: ${todoTitle}${emoji}` },
  ];

  return templates[Math.floor(Math.random() * templates.length)];
};

export const useNotificationScheduler = () => {
  const todos = useTodoStore((s) => s.todos);
  const {
    profileName,
    waterReminderEnabled,
    hydrationGoalMl,
    activeHoursStart,
    activeHoursEnd,
  } = useSessionStore();
  const scheduledIds = useRef(new Set<string>());

  const scheduleForTodo = useCallback(
    async (todoId: string, title: string, reminderDate: Date) => {
      if (scheduledIds.current.has(todoId)) return;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          ...buildNotificationContent(title, profileName || ""),
          data: { todoId, type: "task_reminder" },
          sound: "default",
        },
        trigger: { date: reminderDate, type: Notifications.SchedulableTriggerInputTypes.DATE },
      });

      scheduledIds.current.add(todoId);
      return identifier;
    },
    [profileName],
  );

  const cancelForTodo = useCallback(async (todoId: string) => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.todoId === todoId) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
    scheduledIds.current.delete(todoId);
  }, []);

  const syncSchedules = useCallback(async () => {
    // Cancel only task reminders, not hydration reminders
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const taskReminders = scheduled.filter(
      (n) => n.content.data?.type === "task_reminder" || !n.content.data?.type,
    );
    await Promise.all(
      taskReminders.map((n) =>
        Notifications.cancelScheduledNotificationAsync(n.identifier),
      ),
    );
    scheduledIds.current.clear();

    // Only schedule for active (non-deleted) todos
    const activeTodos = todos.filter(
      (t) => t.deletedAt == null && !t.isCompleted && t.createdAt,
    );

    for (const todo of activeTodos) {
      const reminderDate = new Date();
      reminderDate.setHours(9, 0, 0, 0);
      if (reminderDate <= new Date()) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }

      await scheduleForTodo(todo.id, todo.title, reminderDate);
    }
  }, [todos, scheduleForTodo]);

  /**
   * Syncs water reminder notifications based on current session config.
   * Safe to call multiple times — cancels and recreates to avoid duplicates.
   */
  const scheduleHydrationReminders = useCallback(async () => {
    if (!waterReminderEnabled || !hydrationGoalMl) {
      await cancelHydrationReminders();
      return;
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") return;

      await resyncHydrationReminders({
        goalMl: hydrationGoalMl,
        activeHoursStart,
        activeHoursEnd,
        userName: profileName || undefined,
      });
    } catch {
      // Non-fatal
    }
  }, [waterReminderEnabled, hydrationGoalMl, activeHoursStart, activeHoursEnd, profileName]);

  /**
   * Call this when the user logs water intake to avoid immediate re-reminding.
   * Delays the next water notification by 30 minutes.
   */
  const onWaterLogged = useCallback(async (delayMinutes = 30) => {
    await delayNextHydrationReminder(delayMinutes);
  }, []);

  /**
   * Cancels all hydration reminder notifications.
   * Use when the user disables water reminders in settings.
   */
  const disableHydrationReminders = useCallback(async () => {
    await cancelHydrationReminders();
  }, []);

  useEffect(() => {
    syncSchedules();
  }, [syncSchedules]);

  // Re-sync hydration reminders when config changes
  useEffect(() => {
    scheduleHydrationReminders();
  }, [scheduleHydrationReminders]);

  return {
    scheduleForTodo,
    cancelForTodo,
    syncSchedules,
    scheduleHydrationReminders,
    onWaterLogged,
    disableHydrationReminders,
  };
};
