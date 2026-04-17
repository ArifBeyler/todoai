import { parseTodoInput, type ParsedTodoInput } from "./parseTodoInput";
import { supabase } from "@/src/services/supabase";

type LLMParsedTask = {
  title: string;
  date?: string | null;
  time?: string | null;
  category?: string;
  recurrence?: string;
  priority?: string;
};

type LLMParsedResponse = {
  tasks: LLMParsedTask[];
};

const LLM_PARSE_TIMEOUT_MS = 8000;

const callLLMParser = async (
  transcript: string,
  language: string,
): Promise<LLMParsedResponse | null> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LLM_PARSE_TIMEOUT_MS);

    const { data, error } = await supabase.functions.invoke("parse-voice-llm", {
      body: { transcript, language },
    });

    clearTimeout(timeout);
    if (error || !data) return null;

    // Support both new { tasks: [...] } and legacy single-object response
    if (Array.isArray((data as LLMParsedResponse).tasks)) {
      return data as LLMParsedResponse;
    }
    // Legacy: wrap single object in tasks array
    return { tasks: [data as LLMParsedTask] };
  } catch {
    return null;
  }
};

const mergeLLMTask = (llm: LLMParsedTask, regex: ParsedTodoInput): ParsedTodoInput => ({
  title: llm.title || regex.title,
  date: llm.date ?? regex.date,
  time: llm.time ?? regex.time,
  category: llm.category || regex.category,
  recurrence: llm.recurrence || regex.recurrence || "once",
  priority: llm.priority,
  confidence: Math.min((regex.confidence + 0.85) / 2, 0.95),
  ambiguities: regex.ambiguities?.filter((a) => {
    if (a === "time_ambiguous" && llm.time) return false;
    if (a === "date_ambiguous" && llm.date) return false;
    return true;
  }),
});

/**
 * Parse a transcript into potentially multiple todos.
 * Returns an array of 1–N ParsedTodoInput items.
 */
export const parseTodoInputsWithLLM = async (
  transcript: string,
  language: string = "tr",
): Promise<ParsedTodoInput[]> => {
  const regexResult = parseTodoInput(transcript);

  // Fast path: regex confident enough and no multi-task connectors detected
  const hasMultiTaskSignal = /\b(sonra|ayrıca|bir de|ondan sonra|daha|then|also)\b/i.test(transcript);
  if (regexResult.confidence >= 0.85 && !hasMultiTaskSignal) {
    return [regexResult];
  }

  const llmResponse = await callLLMParser(transcript, language);

  if (!llmResponse || llmResponse.tasks.length === 0) {
    return [regexResult];
  }

  if (llmResponse.tasks.length === 1) {
    return [mergeLLMTask(llmResponse.tasks[0], regexResult)];
  }

  // Multiple tasks: map each with basic confidence
  return llmResponse.tasks.map((task) => ({
    title: task.title || transcript,
    date: task.date ?? undefined,
    time: task.time ?? undefined,
    category: task.category,
    recurrence: task.recurrence || "once",
    priority: task.priority,
    confidence: 0.9,
  }));
};

/**
 * Backward-compatible single-result variant.
 */
export const parseTodoInputWithLLM = async (
  transcript: string,
  language: string = "tr",
): Promise<ParsedTodoInput> => {
  const results = await parseTodoInputsWithLLM(transcript, language);
  return results[0];
};

export type LanguageParserConfig = {
  code: string;
  timeWords: Record<string, string>;
  relativeDates: Record<string, (now: Date) => Date>;
  recurrencePatterns: Record<string, string>;
};

const PARSER_CONFIGS: Record<string, LanguageParserConfig> = {
  tr: {
    code: "tr",
    timeWords: {
      sabah: "09:00",
      öğle: "12:00",
      "öğleden sonra": "14:00",
      akşam: "19:00",
      gece: "22:00",
    },
    relativeDates: {
      bugün: (now) => now,
      yarın: (now) => { const d = new Date(now); d.setDate(d.getDate() + 1); return d; },
      "öbür gün": (now) => { const d = new Date(now); d.setDate(d.getDate() + 2); return d; },
      haftaya: (now) => { const d = new Date(now); d.setDate(d.getDate() + 7); return d; },
    },
    recurrencePatterns: {
      "her gün": "daily",
      "her hafta": "weekly",
      "hafta sonu": "weekend",
    },
  },
  en: {
    code: "en",
    timeWords: {
      morning: "09:00",
      noon: "12:00",
      afternoon: "14:00",
      evening: "19:00",
      night: "22:00",
    },
    relativeDates: {
      today: (now) => now,
      tomorrow: (now) => { const d = new Date(now); d.setDate(d.getDate() + 1); return d; },
      "day after tomorrow": (now) => { const d = new Date(now); d.setDate(d.getDate() + 2); return d; },
      "next week": (now) => { const d = new Date(now); d.setDate(d.getDate() + 7); return d; },
    },
    recurrencePatterns: {
      "every day": "daily",
      daily: "daily",
      "every week": "weekly",
      weekly: "weekly",
      weekend: "weekend",
    },
  },
};

export const getParserConfig = (language: string): LanguageParserConfig =>
  PARSER_CONFIGS[language] ?? PARSER_CONFIGS.tr;

export const parseMultiLanguage = (
  text: string,
  language: string,
): ParsedTodoInput => {
  const config = getParserConfig(language);
  const now = new Date();
  let title = text.trim();
  let date: string | undefined;
  let time: string | undefined;
  let recurrence: string | undefined;
  const ambiguities: string[] = [];

  for (const [pattern, rec] of Object.entries(config.recurrencePatterns)) {
    const regex = new RegExp(`\\b${pattern}\\b`, "gi");
    if (regex.test(title)) {
      recurrence = rec;
      title = title.replace(regex, "").trim();
    }
  }

  for (const [word, resolver] of Object.entries(config.relativeDates)) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    if (regex.test(title)) {
      const resolved = resolver(now);
      date = resolved.toISOString().split("T")[0];
      title = title.replace(regex, "").trim();
    }
  }

  for (const [word, defaultTime] of Object.entries(config.timeWords)) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    if (regex.test(title)) {
      time = defaultTime;
      title = title.replace(regex, "").trim();
      ambiguities.push("time_ambiguous");
    }
  }

  const timeMatch = title.match(/\b(\d{1,2})[:\.](\d{2})\b/);
  if (timeMatch && !time) {
    const hour = parseInt(timeMatch[1], 10);
    const minute = parseInt(timeMatch[2], 10);
    if (hour <= 23 && minute <= 59) {
      time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      title = title.replace(timeMatch[0], "").trim();
    }
  }

  title = title.replace(/\s{2,}/g, " ").replace(/^[,.\s]+|[,.\s]+$/g, "").trim();

  let confidence = 0.5;
  if (title.length > 3) confidence += 0.2;
  if (date || time) confidence += 0.15;
  if (recurrence) confidence += 0.05;
  if (ambiguities.length > 0) confidence -= 0.1;

  return {
    title: title || text.trim(),
    date,
    time,
    recurrence: recurrence ?? "once",
    confidence: Math.min(1, Math.max(0, confidence)),
    ambiguities: ambiguities.length > 0 ? ambiguities : undefined,
  };
};
