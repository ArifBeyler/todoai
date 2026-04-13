import type { Recurrence } from "@/src/state/useTodoStore";

export const normalizeRecurrence = (raw: string | undefined): Recurrence => {
  const map: Record<string, Recurrence> = {
    once: "once",
    daily: "daily",
    weekly: "weekly",
    weekend: "weekend",
    weekdays: "weekdays",
    custom: "custom",
  };
  return map[raw ?? ""] ?? "once";
};

export const normalizePriority = (
  raw: string | undefined,
): "low" | "medium" | "high" => {
  if (raw === "low" || raw === "medium" || raw === "high") return raw;
  return "medium";
};

/** English category keys from LLM / parser → Turkish UI */
export const CATEGORY_LABELS_TR: Record<string, string> = {
  work: "İş",
  health: "Sağlık",
  home: "Ev",
  shopping: "Alışveriş",
  social: "Sosyal",
  education: "Eğitim",
  fitness: "Spor",
  selfcare: "Kendine zaman",
  errands: "Günlük işler",
  finance: "Finans",
  pet: "Evcil hayvan",
  other: "Genel",
  personal: "Kişisel",
};

export const recurrenceToLabelTr = (r: Recurrence): string => {
  const map: Record<Recurrence, string> = {
    once: "Tek seferlik",
    daily: "Her gün",
    weekly: "Haftalık",
    weekend: "Hafta sonu",
    weekdays: "Hafta içi",
    custom: "Özel tekrar",
  };
  return map[r] ?? "Tek seferlik";
};

export const priorityToLabelTr = (p: "low" | "medium" | "high"): string => {
  const map = {
    low: "Düşük öncelik",
    medium: "Orta öncelik",
    high: "Yüksek öncelik",
  } as const;
  return map[p];
};

export const categoryToLabelTr = (key: string | undefined): string =>
  CATEGORY_LABELS_TR[key ?? ""] ?? (key ? key : "Genel");

/** "14 Nisan • 15:00" */
export const formatScheduleLine = (isoDate?: string, time?: string): string | null => {
  if (!isoDate && !time) return null;
  let datePart = "";
  if (isoDate) {
    try {
      datePart = new Date(isoDate + "T12:00:00").toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
      });
    } catch {
      datePart = isoDate;
    }
  }
  const timePart = time?.trim() ?? "";
  if (datePart && timePart) return `${datePart} • ${timePart}`;
  if (datePart) return datePart;
  if (timePart) return timePart;
  return null;
};

const startOfDay = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** Softer context e.g. "Yarın öğleden sonra" */
export const formatScheduleHint = (isoDate?: string, time?: string): string | null => {
  if (!isoDate && !time) return null;

  let dayPhrase = "";
  if (isoDate) {
    try {
      const target = startOfDay(new Date(isoDate + "T12:00:00"));
      const today = startOfDay(new Date());
      const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
      if (diff === 0) dayPhrase = "Bugün";
      else if (diff === 1) dayPhrase = "Yarın";
      else if (diff === 2) dayPhrase = "Öbür gün";
      else if (diff > 2 && diff <= 7) dayPhrase = "Bu hafta";
    } catch {
      /* ignore */
    }
  }

  let timePhrase = "";
  if (time) {
    const [hs] = time.split(":");
    const hour = parseInt(hs ?? "0", 10);
    if (!Number.isNaN(hour)) {
      if (hour >= 5 && hour < 12) timePhrase = "sabah";
      else if (hour >= 12 && hour < 17) timePhrase = "öğleden sonra";
      else if (hour >= 17 && hour < 21) timePhrase = "akşam";
      else timePhrase = "gece";
    }
  }

  if (dayPhrase && timePhrase) return `${dayPhrase} ${timePhrase}`;
  if (dayPhrase) return dayPhrase;
  if (timePhrase) {
    const t = timePhrase;
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  return null;
};
