import { useCallback, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useTodoStore } from "@/src/state/useTodoStore";
import { useSessionStore } from "@/src/state/useSessionStore";
import { classifyTodoMeaning, shouldUseEmoji } from "@/src/utils/classifyTodoMeaning";

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
  const profileName = useSessionStore((s) => s.profileName);
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
    await Notifications.cancelAllScheduledNotificationsAsync();
    scheduledIds.current.clear();

    const activeTodos = todos.filter(
      (t) => !t.isCompleted && t.createdAt,
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

  useEffect(() => {
    syncSchedules();
  }, [syncSchedules]);

  return { scheduleForTodo, cancelForTodo, syncSchedules };
};
