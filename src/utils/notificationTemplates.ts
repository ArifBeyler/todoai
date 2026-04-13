import { type TodoMeaning, classifyTodoMeaning, shouldUseEmoji } from "./classifyTodoMeaning";

export type NotificationTone = "energetic" | "calm" | "warm" | "urgent" | "curious" | "gentle";

export type NotificationCategory =
  | "task_reminder"
  | "ai_suggestion"
  | "focus_nudge"
  | "visual_ready"
  | "achievement"
  | "summary"
  | "system"
  | "re_engagement";

type TemplateEntry = {
  category: NotificationCategory;
  tone: NotificationTone;
  title: string;
  body: string;
};

const TEMPLATES: TemplateEntry[] = [
  // Task Reminders - Energetic
  {
    category: "task_reminder",
    tone: "energetic",
    title: "Görev Zamanı!",
    body: "{name}, {todoTitle} için hazırsan başlayalım! {emoji}",
  },
  {
    category: "task_reminder",
    tone: "energetic",
    title: "Bugünün Görevi",
    body: "{todoTitle} — bugün bunu bitirmek harika olur {emoji}",
  },
  {
    category: "task_reminder",
    tone: "energetic",
    title: "Harekete Geç",
    body: "Günün görevi seni bekliyor: {todoTitle} {emoji}",
  },

  // Task Reminders - Calm
  {
    category: "task_reminder",
    tone: "calm",
    title: "Hatırlatma",
    body: "{name}, yarın için not: {todoTitle}",
  },
  {
    category: "task_reminder",
    tone: "calm",
    title: "Listende",
    body: "Sakin bir hatırlatma: {todoTitle} listende",
  },
  {
    category: "task_reminder",
    tone: "calm",
    title: "Zamanı Geldiğinde",
    body: "Zamanı geldiğinde: {todoTitle}",
  },

  // Task Reminders - Warm (relationship/pet)
  {
    category: "task_reminder",
    tone: "warm",
    title: "Sevdiklerin",
    body: "{name}, köpek dostun seni bekliyor 🐶",
  },
  {
    category: "task_reminder",
    tone: "warm",
    title: "Güzel Bir Gün",
    body: "Anneni aramak için güzel bir gün 💛",
  },
  {
    category: "task_reminder",
    tone: "warm",
    title: "Zaman Ayır",
    body: "{name}, sevdiklerine zaman ayırmak için harika bir an ❤️",
  },

  // Task Reminders - Urgent
  {
    category: "task_reminder",
    tone: "urgent",
    title: "Geciken Görev",
    body: "{todoTitle} gecikti — bugün bitirelim mi?",
  },
  {
    category: "task_reminder",
    tone: "urgent",
    title: "Hatırlatma",
    body: "Küçük bir adım: {todoTitle} hala seni bekliyor",
  },

  // AI Suggestion
  {
    category: "ai_suggestion",
    tone: "curious",
    title: "Bir Fikrim Var",
    body: "{name}, sana bir fikrim var: {suggestionTitle} — ne dersin?",
  },
  {
    category: "ai_suggestion",
    tone: "curious",
    title: "Belki Bugün?",
    body: "Belki de bugün {suggestionTitle} zamanıdır?",
  },

  // Focus Nudge
  {
    category: "focus_nudge",
    tone: "energetic",
    title: "Odaklan",
    body: "{name}, 25 dakika odaklanmaya ne dersin?",
  },
  {
    category: "focus_nudge",
    tone: "gentle",
    title: "Seri Devam",
    body: "Odak serini {streak} güne çıkarmak ister misin?",
  },

  // Visual Ready
  {
    category: "visual_ready",
    tone: "warm",
    title: "Görselin Hazır!",
    body: "Günlük görselin hazır — gel ve gör! ✨",
  },
  {
    category: "visual_ready",
    tone: "warm",
    title: "Yeni Görsel",
    body: "{name}, yeni görselin seni bekliyor",
  },

  // Achievement
  {
    category: "achievement",
    tone: "warm",
    title: "Tebrikler!",
    body: "Tebrikler! {points} puana ulaştın 🎯",
  },
  {
    category: "achievement",
    tone: "energetic",
    title: "Seri!",
    body: "{streak} günlük seri! Devam et {name} 🔥",
  },

  // Evening Summary
  {
    category: "summary",
    tone: "gentle",
    title: "Günün Özeti",
    body: "{name}, bugün {completed}/{total} görev tamamladın. Güzel iş!",
  },
  {
    category: "summary",
    tone: "calm",
    title: "Gün Sonu",
    body: "Günün özeti: {completed} görev tamam, yarın {remaining} görev var",
  },

  // Re-engagement
  {
    category: "re_engagement",
    tone: "warm",
    title: "Seni Özledik",
    body: "{name}, seni özledik. Görevlerin seni bekliyor 💫",
  },
];

export type NotificationContext = {
  isActiveHours: boolean;
  todoTitle?: string;
  todoMeaning?: TodoMeaning;
  userName: string;
  streak?: number;
  points?: number;
  completed?: number;
  total?: number;
  remaining?: number;
  suggestionTitle?: string;
};

const pickToneForContext = (
  category: NotificationCategory,
  isActiveHours: boolean,
  todoMeaning?: TodoMeaning,
): NotificationTone => {
  if (category === "ai_suggestion") return "curious";
  if (category === "achievement") return "warm";
  if (category === "summary") return "gentle";
  if (category === "re_engagement") return "warm";
  if (category === "visual_ready") return "warm";
  if (category === "system") return "calm";

  if (category === "task_reminder") {
    if (todoMeaning?.tone === "warm") return "warm";
    if (!isActiveHours) return "calm";
    return "energetic";
  }

  if (category === "focus_nudge") {
    return isActiveHours ? "energetic" : "gentle";
  }

  return isActiveHours ? "energetic" : "calm";
};

const fillTemplate = (
  template: string,
  context: NotificationContext,
  meaning?: TodoMeaning,
): string => {
  let result = template;
  result = result.replace(/\{name\}/g, context.userName);
  result = result.replace(/\{todoTitle\}/g, context.todoTitle ?? "");
  result = result.replace(/\{streak\}/g, String(context.streak ?? 0));
  result = result.replace(/\{points\}/g, String(context.points ?? 0));
  result = result.replace(/\{completed\}/g, String(context.completed ?? 0));
  result = result.replace(/\{total\}/g, String(context.total ?? 0));
  result = result.replace(/\{remaining\}/g, String(context.remaining ?? 0));
  result = result.replace(/\{suggestionTitle\}/g, context.suggestionTitle ?? "");

  const emojiContext = context.isActiveHours ? "active_hours" : "outside_hours";
  const useEmoji = meaning ? shouldUseEmoji(meaning, emojiContext) : false;
  result = result.replace(/\{emoji\}/g, useEmoji && meaning ? meaning.emoji : "");

  return result.replace(/\s{2,}/g, " ").trim();
};

export const generateNotification = (
  category: NotificationCategory,
  context: NotificationContext,
): { title: string; body: string; tone: NotificationTone } => {
  const meaning = context.todoTitle
    ? classifyTodoMeaning(context.todoTitle)
    : context.todoMeaning;

  const tone = pickToneForContext(category, context.isActiveHours, meaning);

  const candidates = TEMPLATES.filter(
    (t) => t.category === category && t.tone === tone,
  );

  if (candidates.length === 0) {
    const fallbacks = TEMPLATES.filter((t) => t.category === category);
    const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)] ??
      TEMPLATES[0];
    return {
      title: fillTemplate(fallback.title, context, meaning),
      body: fillTemplate(fallback.body, context, meaning),
      tone,
    };
  }

  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    title: fillTemplate(selected.title, context, meaning),
    body: fillTemplate(selected.body, context, meaning),
    tone,
  };
};
