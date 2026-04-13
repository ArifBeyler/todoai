import * as Notifications from "expo-notifications";

const DEFAULT_ACTIVE_START = 8;  // 08:00
const DEFAULT_ACTIVE_END = 21;   // 21:00
const INTAKE_PER_REMINDER_ML = 250;
const REMINDER_NOTIFICATION_TAG = "hydration_reminder";

// Minimum gap between reminders in hours to prevent spamming
const MIN_REMINDER_GAP_HOURS = 0.75;

export type HydrationReminderConfig = {
  goalMl: number;
  activeHoursStart: number | null; // 0-23, null → use default
  activeHoursEnd: number | null;   // 0-23, null → use default
  userName?: string;
};

type ScheduledHour = {
  hour: number;
  identifier?: string;
};

const REMINDER_BODIES = [
  "Su içme vakti! Biraz su iç, enerjin artsın.",
  "Günlük su hedefine bir adım daha yaklaş.",
  "Biraz su iç — vücudun sana teşekkür eder.",
  "Su molası! Bugünkü hedefe yaklaşıyorsun.",
  "Sağlıklı bir gün için bir bardak su içelim.",
];

/**
 * Distributes `count` water reminders evenly within [startHour, endHour].
 * Enforces a minimum gap of MIN_REMINDER_GAP_HOURS between reminders.
 */
export const computeReminderHours = (
  goalMl: number,
  startHour: number,
  endHour: number,
): number[] => {
  const windowHours = endHour - startHour;
  if (windowHours <= 0) return [];

  const count = Math.max(1, Math.floor(goalMl / INTAKE_PER_REMINDER_ML));
  const intervalHours = windowHours / count;

  // Enforce minimum gap
  const effectiveInterval = Math.max(MIN_REMINDER_GAP_HOURS, intervalHours);
  const effectiveCount = Math.min(count, Math.floor(windowHours / effectiveInterval));

  return Array.from({ length: effectiveCount }, (_, i) => {
    const rawHour = startHour + i * (windowHours / effectiveCount);
    return Math.min(endHour - 1, Math.round(rawHour));
  });
};

/**
 * Returns a Date object for a given hour today (or tomorrow if that hour already passed).
 */
const buildReminderDate = (hour: number): Date => {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  if (d <= new Date()) {
    d.setDate(d.getDate() + 1);
  }
  return d;
};

/**
 * Schedules daily water reminder notifications evenly spread within the user's
 * active hours window. Falls back to 08:00–21:00 if no active hours are set.
 *
 * Returns the list of scheduled notification identifiers for later cancellation.
 */
export const scheduleHydrationReminders = async (
  config: HydrationReminderConfig,
): Promise<string[]> => {
  const startHour = config.activeHoursStart ?? DEFAULT_ACTIVE_START;
  const endHour = config.activeHoursEnd ?? DEFAULT_ACTIVE_END;
  const hours = computeReminderHours(config.goalMl, startHour, endHour);

  const identifiers: string[] = [];

  for (let i = 0; i < hours.length; i++) {
    const hour = hours[i];
    const body = REMINDER_BODIES[i % REMINDER_BODIES.length];

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: config.userName ? `${config.userName}, su içme vakti!` : "Su içme vakti!",
          body,
          data: { type: REMINDER_NOTIFICATION_TAG, hour },
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: 0,
        },
      });
      identifiers.push(id);
    } catch {
      // Skip individual failures — partial schedule is still useful
    }
  }

  return identifiers;
};

/**
 * Cancels all previously scheduled hydration reminder notifications.
 */
export const cancelHydrationReminders = async (): Promise<void> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const hydrationNotifs = scheduled.filter(
    (n) => n.content.data?.type === REMINDER_NOTIFICATION_TAG,
  );

  await Promise.all(
    hydrationNotifs.map((n) =>
      Notifications.cancelScheduledNotificationAsync(n.identifier),
    ),
  );
};

/**
 * Reschedules hydration reminders when config changes (goal, active hours).
 * Cancels existing ones first to avoid duplicates.
 */
export const resyncHydrationReminders = async (
  config: HydrationReminderConfig,
): Promise<string[]> => {
  await cancelHydrationReminders();
  return scheduleHydrationReminders(config);
};

/**
 * Delays the next water reminder by `delayMinutes` if the user recently logged water.
 * Finds the next upcoming hydration notification and reschedules it later.
 */
export const delayNextHydrationReminder = async (
  delayMinutes: number = 30,
): Promise<void> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const now = new Date();

  const upcoming = scheduled
    .filter((n) => n.content.data?.type === REMINDER_NOTIFICATION_TAG)
    .sort((a, b) => {
      const aTime = (a.trigger as any)?.value ?? 0;
      const bTime = (b.trigger as any)?.value ?? 0;
      return aTime - bTime;
    })[0];

  if (!upcoming) return;

  const delayedDate = new Date(now.getTime() + delayMinutes * 60_000);

  try {
    await Notifications.cancelScheduledNotificationAsync(upcoming.identifier);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: upcoming.content.title ?? undefined,
        body: upcoming.content.body ?? undefined,
        data: upcoming.content.data,
        sound: (upcoming.content.sound as string) ?? "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: delayedDate,
      },
    });
  } catch {
    // Non-critical
  }
};
