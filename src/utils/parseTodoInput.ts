import { classifyTodoMeaning } from "./classifyTodoMeaning";

export type ParsedTodoInput = {
  title: string;
  date?: string;
  time?: string;
  category?: string;
  recurrence?: string;
  confidence: number;
  ambiguities?: string[];
};

type TemporalMatch = {
  type: "date" | "time" | "recurrence";
  value: string;
  raw: string;
  startIndex: number;
  endIndex: number;
  ambiguous?: boolean;
};

const DAYS_TR: Record<string, number> = {
  pazartesi: 1,
  salı: 2,
  çarşamba: 3,
  perşembe: 4,
  cuma: 5,
  cumartesi: 6,
  pazar: 0,
};

const getNextWeekday = (targetDay: number, baseDate: Date): Date => {
  const current = baseDate.getDay();
  let diff = targetDay - current;
  if (diff <= 0) diff += 7;
  const result = new Date(baseDate);
  result.setDate(result.getDate() + diff);
  return result;
};

const formatDate = (d: Date): string => d.toISOString().split("T")[0];

const extractTemporalTokens = (text: string): TemporalMatch[] => {
  const matches: TemporalMatch[] = [];
  const now = new Date();
  const currentHour = now.getHours();

  const patterns: {
    regex: RegExp;
    handler: (m: RegExpExecArray) => TemporalMatch | null;
  }[] = [
    {
      regex: /\bher\s+gün\b/gi,
      handler: (m) => ({
        type: "recurrence",
        value: "daily",
        raw: m[0],
        startIndex: m.index,
        endIndex: m.index + m[0].length,
      }),
    },
    {
      regex: /\bher\s+hafta\b/gi,
      handler: (m) => ({
        type: "recurrence",
        value: "weekly",
        raw: m[0],
        startIndex: m.index,
        endIndex: m.index + m[0].length,
      }),
    },
    {
      regex: /\bhafta\s+sonu\b/gi,
      handler: (m) => ({
        type: "recurrence",
        value: "weekend",
        raw: m[0],
        startIndex: m.index,
        endIndex: m.index + m[0].length,
      }),
    },
    {
      regex: /\bbugün\b/gi,
      handler: (m) => ({
        type: "date",
        value: formatDate(now),
        raw: m[0],
        startIndex: m.index,
        endIndex: m.index + m[0].length,
      }),
    },
    {
      regex: /\byarın\b/gi,
      handler: (m) => {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
          type: "date",
          value: formatDate(tomorrow),
          raw: m[0],
          startIndex: m.index,
          endIndex: m.index + m[0].length,
        };
      },
    },
    {
      regex: /\böbür\s+gün\b/gi,
      handler: (m) => {
        const dayAfter = new Date(now);
        dayAfter.setDate(dayAfter.getDate() + 2);
        return {
          type: "date",
          value: formatDate(dayAfter),
          raw: m[0],
          startIndex: m.index,
          endIndex: m.index + m[0].length,
        };
      },
    },
    {
      regex: /\bhaftaya\b/gi,
      handler: (m) => {
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return {
          type: "date",
          value: formatDate(nextWeek),
          raw: m[0],
          startIndex: m.index,
          endIndex: m.index + m[0].length,
        };
      },
    },
    {
      regex: /\bgelecek\s+(pazartesi|salı|çarşamba|perşembe|cuma|cumartesi|pazar)\b/gi,
      handler: (m) => {
        const dayName = m[1].toLowerCase() as keyof typeof DAYS_TR;
        const targetDay = DAYS_TR[dayName];
        if (targetDay === undefined) return null;
        const date = getNextWeekday(targetDay, now);
        date.setDate(date.getDate() + 7);
        return {
          type: "date",
          value: formatDate(date),
          raw: m[0],
          startIndex: m.index,
          endIndex: m.index + m[0].length,
        };
      },
    },
    {
      regex: /\b(pazartesi|salı|çarşamba|perşembe|cuma|cumartesi|pazar)\b/gi,
      handler: (m) => {
        const dayName = m[1].toLowerCase() as keyof typeof DAYS_TR;
        const targetDay = DAYS_TR[dayName];
        if (targetDay === undefined) return null;
        return {
          type: "date",
          value: formatDate(getNextWeekday(targetDay, now)),
          raw: m[0],
          startIndex: m.index,
          endIndex: m.index + m[0].length,
        };
      },
    },
    {
      regex: /\bakşam\s+(\d{1,2})(?:[:\.](\d{2}))?\s*(?:'de|'da|de|da)?\b/gi,
      handler: (m) => {
        let hour = parseInt(m[1], 10);
        const minute = m[2] ? parseInt(m[2], 10) : 0;
        if (hour < 12) hour += 12;
        return {
          type: "time",
          value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          raw: m[0],
          startIndex: m.index,
          endIndex: m.index + m[0].length,
        };
      },
    },
    {
      regex: /\bsabah\s+(\d{1,2})(?:[:\.](\d{2}))?\s*(?:'de|'da|de|da)?\b/gi,
      handler: (m) => {
        const hour = parseInt(m[1], 10);
        const minute = m[2] ? parseInt(m[2], 10) : 0;
        return {
          type: "time",
          value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          raw: m[0],
          startIndex: m.index,
          endIndex: m.index + m[0].length,
        };
      },
    },
    {
      regex: /\bsaat\s+(\d{1,2})(?:[:\.](\d{2}))?\s*(?:gibi|civarı|'de|'da|de|da)?\b/gi,
      handler: (m) => {
        let hour = parseInt(m[1], 10);
        const minute = m[2] ? parseInt(m[2], 10) : 0;
        let ambiguous = false;
        if (hour >= 1 && hour <= 6) {
          if (currentHour < 12) {
            hour += 12;
          }
          ambiguous = true;
        }
        return {
          type: "time",
          value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          raw: m[0],
          startIndex: m.index,
          endIndex: m.index + m[0].length,
          ambiguous,
        };
      },
    },
    {
      regex: /\b(\d{1,2})[:\.](\d{2})\s*(?:'de|'da|de|da)?\b/gi,
      handler: (m) => {
        const hour = parseInt(m[1], 10);
        const minute = parseInt(m[2], 10);
        if (hour > 23 || minute > 59) return null;
        return {
          type: "time",
          value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          raw: m[0],
          startIndex: m.index,
          endIndex: m.index + m[0].length,
        };
      },
    },
    {
      regex: /\bsabah\b/gi,
      handler: (m) => ({
        type: "time",
        value: "09:00",
        raw: m[0],
        startIndex: m.index,
        endIndex: m.index + m[0].length,
        ambiguous: true,
      }),
    },
    {
      regex: /\böğle(?:n)?\b/gi,
      handler: (m) => ({
        type: "time",
        value: "12:00",
        raw: m[0],
        startIndex: m.index,
        endIndex: m.index + m[0].length,
        ambiguous: true,
      }),
    },
    {
      regex: /\bakşam\b/gi,
      handler: (m) => ({
        type: "time",
        value: "19:00",
        raw: m[0],
        startIndex: m.index,
        endIndex: m.index + m[0].length,
        ambiguous: true,
      }),
    },
    {
      regex: /\bgece\b/gi,
      handler: (m) => ({
        type: "time",
        value: "22:00",
        raw: m[0],
        startIndex: m.index,
        endIndex: m.index + m[0].length,
        ambiguous: true,
      }),
    },
  ];

  for (const { regex, handler } of patterns) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const result = handler(match);
      if (result) {
        const overlapping = matches.some(
          (existing) =>
            result.startIndex < existing.endIndex &&
            result.endIndex > existing.startIndex,
        );
        if (!overlapping) {
          matches.push(result);
        }
      }
    }
  }

  return matches;
};

const cleanTitle = (text: string, matches: TemporalMatch[]): string => {
  let result = text;
  const sorted = [...matches].sort((a, b) => b.startIndex - a.startIndex);
  for (const m of sorted) {
    result = result.slice(0, m.startIndex) + result.slice(m.endIndex);
  }
  return result
    .replace(/\s{2,}/g, " ")
    .replace(/^\s+|\s+$/g, "")
    .replace(/^[,.\s]+|[,.\s]+$/g, "")
    .trim();
};

export const parseTodoInput = (text: string): ParsedTodoInput => {
  if (!text || text.trim().length === 0) {
    return { title: "", confidence: 0, ambiguities: ["empty_input"] };
  }

  const trimmed = text.trim();
  const temporalMatches = extractTemporalTokens(trimmed);

  let date: string | undefined;
  let time: string | undefined;
  let recurrence: string | undefined;
  const ambiguities: string[] = [];

  for (const match of temporalMatches) {
    if (match.type === "date" && !date) {
      date = match.value;
      if (match.ambiguous) ambiguities.push("date_ambiguous");
    } else if (match.type === "time" && !time) {
      time = match.value;
      if (match.ambiguous) ambiguities.push("time_ambiguous");
    } else if (match.type === "recurrence" && !recurrence) {
      recurrence = match.value;
    }
  }

  const title = cleanTitle(trimmed, temporalMatches) || trimmed;
  const meaning = classifyTodoMeaning(title);
  const category = meaning.category === "general" ? undefined : meaning.category;

  let confidence = 0.5;
  if (title.length > 3) confidence += 0.2;
  if (date || time) confidence += 0.15;
  if (category) confidence += 0.1;
  if (ambiguities.length > 0) confidence -= 0.1;
  confidence = Math.min(1, Math.max(0, confidence));

  return {
    title,
    date,
    time,
    category,
    recurrence: recurrence ?? "once",
    confidence,
    ambiguities: ambiguities.length > 0 ? ambiguities : undefined,
  };
};
