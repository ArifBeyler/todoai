import { classifyTodoMeaning, type TodoMeaning, type TodoTone } from "./classifyTodoMeaning";

export type UserBehaviorSignals = {
  totalNotificationsSentToday: number;
  lastNotificationSentAt: string | null;
  consecutiveDismissals: number;
  lastAppOpenAt: string | null;
  daysSinceLastOpen: number;
  completionRateThisWeek: number;
  focusStreakDays: number;
  preferredActiveStart: string;
  preferredActiveEnd: string;
  timezone: string;
};

export type NotificationDecision = {
  shouldSend: boolean;
  reason: string;
  tone: TodoTone;
  useEmoji: boolean;
  selectedEmoji: string;
  category: string;
  priority: "high" | "medium" | "low";
  deferUntil?: string;
};

const MAX_DAILY = 5;
const MIN_GAP_MS = 90 * 60 * 1000;
const SNOOZE_THRESHOLD = 3;
const RE_ENGAGEMENT_QUIET_DAYS = 7;
const DISMISS_REDUCTION_DAYS = 7;

const getCurrentLocalTime = (timezone: string): string => {
  try {
    return new Date().toLocaleTimeString("en-US", { timeZone: timezone, hour12: false });
  } catch {
    return new Date().toLocaleTimeString("en-US", { hour12: false });
  }
};

const isInRange = (time: string, start: string, end: string): boolean => {
  if (start > end) {
    return time >= start || time < end;
  }
  return time >= start && time < end;
};

export const evaluateNotificationDecision = (
  todoTitle: string | null,
  category: string,
  signals: UserBehaviorSignals,
): NotificationDecision => {
  const meaning = todoTitle ? classifyTodoMeaning(todoTitle) : null;
  const localTime = getCurrentLocalTime(signals.timezone || "UTC");

  if (signals.totalNotificationsSentToday >= MAX_DAILY) {
    return {
      shouldSend: false,
      reason: "daily_limit_reached",
      tone: "focused",
      useEmoji: false,
      selectedEmoji: "",
      category,
      priority: "low",
    };
  }

  if (signals.lastNotificationSentAt) {
    const gap = Date.now() - new Date(signals.lastNotificationSentAt).getTime();
    if (gap < MIN_GAP_MS) {
      return {
        shouldSend: false,
        reason: "min_gap_not_met",
        tone: "focused",
        useEmoji: false,
        selectedEmoji: "",
        category,
        priority: "low",
      };
    }
  }

  if (signals.consecutiveDismissals >= SNOOZE_THRESHOLD) {
    const reducedLimit = Math.ceil(MAX_DAILY / 2);
    if (signals.totalNotificationsSentToday >= reducedLimit) {
      return {
        shouldSend: false,
        reason: "snooze_mode_active",
        tone: "gentle",
        useEmoji: false,
        selectedEmoji: "",
        category,
        priority: "low",
      };
    }
  }

  if (signals.daysSinceLastOpen >= 3 && signals.daysSinceLastOpen < RE_ENGAGEMENT_QUIET_DAYS) {
    if (category !== "re_engagement") {
      return {
        shouldSend: false,
        reason: "user_inactive_wrong_category",
        tone: "warm",
        useEmoji: true,
        selectedEmoji: "💫",
        category,
        priority: "low",
      };
    }
  }

  if (signals.daysSinceLastOpen >= RE_ENGAGEMENT_QUIET_DAYS) {
    return {
      shouldSend: false,
      reason: "user_inactive_quiet_period",
      tone: "warm",
      useEmoji: false,
      selectedEmoji: "",
      category,
      priority: "low",
    };
  }

  const isActiveHours = isInRange(
    localTime,
    signals.preferredActiveStart || "09:00",
    signals.preferredActiveEnd || "18:00",
  );

  let tone: TodoTone;
  let useEmoji: boolean;
  let selectedEmoji = "";

  if (meaning) {
    tone = meaning.tone;
    if (isActiveHours) {
      useEmoji = meaning.category !== "general" && meaning.emoji !== "";
      selectedEmoji = useEmoji ? meaning.emoji : "";
    } else {
      tone = "gentle";
      useEmoji = meaning.tone === "warm" && meaning.emoji !== "";
      selectedEmoji = useEmoji ? meaning.emoji : "";
    }
  } else {
    tone = isActiveHours ? "focused" : "gentle";
    useEmoji = false;
  }

  if (category === "achievement") {
    useEmoji = true;
    tone = "warm";
    if (!selectedEmoji) selectedEmoji = "🎯";
  }

  if (category === "focus_nudge" && signals.focusStreakDays > 0) {
    useEmoji = true;
    selectedEmoji = "🔥";
    tone = "energetic";
  }

  if (signals.completionRateThisWeek < 0.3) {
    tone = "gentle";
  }

  let priority: "high" | "medium" | "low" = "medium";
  if (category === "task_reminder") priority = "high";
  if (category === "system") priority = "high";
  if (category === "ai_suggestion") priority = "low";
  if (category === "summary") priority = "low";

  return {
    shouldSend: true,
    reason: "approved",
    tone,
    useEmoji,
    selectedEmoji,
    category,
    priority,
  };
};

export type WeeklySummaryData = {
  tasksCompleted: number;
  totalTasks: number;
  focusMinutes: number;
  focusStreak: number;
  pointsEarned: number;
  topCategory: string;
};

export const generateWeeklySummaryBody = (
  userName: string,
  data: WeeklySummaryData,
): { title: string; body: string } => {
  const rate = data.totalTasks > 0
    ? Math.round((data.tasksCompleted / data.totalTasks) * 100)
    : 0;

  let body = `${userName}, bu hafta ${data.tasksCompleted}/${data.totalTasks} görev tamamladın (%${rate}).`;

  if (data.focusMinutes > 0) {
    body += ` ${data.focusMinutes} dakika odaklandın.`;
  }

  if (data.focusStreak > 1) {
    body += ` ${data.focusStreak} günlük odak serisi! 🔥`;
  }

  if (data.pointsEarned > 0) {
    body += ` +${data.pointsEarned} puan kazandın.`;
  }

  return {
    title: "Haftalık Özet",
    body,
  };
};

export const selectStreakNotification = (
  userName: string,
  streakDays: number,
): { title: string; body: string } | null => {
  const milestones = [3, 7, 14, 21, 30, 50, 100];
  if (!milestones.includes(streakDays)) return null;

  const emojis = ["🎯", "🔥", "💪", "⭐", "🏆", "👑", "🚀"];
  const idx = milestones.indexOf(streakDays);
  const emoji = emojis[Math.min(idx, emojis.length - 1)];

  return {
    title: `${streakDays} Günlük Seri! ${emoji}`,
    body: `${userName}, ${streakDays} gün üst üste odaklandın. Harika gidiyorsun!`,
  };
};

export const selectPointsMilestoneNotification = (
  userName: string,
  totalPoints: number,
): { title: string; body: string } | null => {
  const milestones = [100, 250, 500, 1000, 2500, 5000, 10000];
  if (!milestones.includes(totalPoints)) return null;

  return {
    title: `${totalPoints} Puan! 🏆`,
    body: `${userName}, ${totalPoints} puana ulaştın. Üretkenliğin takdire şayan!`,
  };
};
