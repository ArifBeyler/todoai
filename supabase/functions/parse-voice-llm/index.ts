import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, json, badRequest, methodNotAllowed, serverError } from "../_shared/http.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { FAL_MODELS, runFalQueueJob } from "../_shared/fal.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_MODEL = "llama-3.1-8b-instant";
const FAL_KEY = Deno.env.get("FAL_KEY") ?? "";

/** Default LLM on Fal (cheap + fast; billed via your Fal balance) */
const FAL_PARSE_MODEL = Deno.env.get("FAL_PARSE_MODEL") ?? "google/gemini-2.5-flash-lite";

type ParsedTask = {
  title: string;
  date: string | null;
  time: string | null;
  category: string;
  recurrence: string;
  priority: string;
};

type ParsedTasksResult = { tasks: ParsedTask[] };
type ParseError = { error: string };

const buildPrompt = (transcript: string, language: string): string => {
  const lang = language === "en" ? "English" : "Turkish";
  return `Parse this ${lang} voice command into one or more structured todo tasks.

The user may describe multiple tasks connected by words like "sonra" (then), "ayrıca" (also), "bir de" (also), "ve" (and), "ondan sonra" (after that).
Split them into separate tasks when they are clearly distinct actions.

For each task extract:
- title: the main task description (cleaned, without time/date fragments)
- date: ISO date string (YYYY-MM-DD) if mentioned, null otherwise
- time: HH:mm 24h format if mentioned, null otherwise
- category: one of [work, health, home, shopping, social, education, fitness, selfcare, errands, finance, pet, other]
- recurrence: one of [once, daily, weekly, weekend] if mentioned, "once" otherwise
- priority: one of [low, medium, high] based on urgency, default "medium"

Voice input: "${transcript.replace(/"/g, '\\"')}"

Return ONLY a valid JSON object with a single "tasks" array (1–5 items). No explanation, no markdown.
Example: {"tasks":[{"title":"...","date":null,"time":null,"category":"other","recurrence":"once","priority":"medium"}]}`;
};

const stripJsonFences = (raw: string): string => {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  }
  return t.trim();
};

const normalizeTask = (parsed: Record<string, unknown>, fallback: string): ParsedTask => ({
  title: (parsed.title as string) || fallback,
  date: (parsed.date as string) ?? null,
  time: (parsed.time as string) ?? null,
  category: (parsed.category as string) ?? "other",
  recurrence: (parsed.recurrence as string) ?? "once",
  priority: (parsed.priority as string) ?? "medium",
});

const parseGroq = async (
  transcript: string,
  language: string,
): Promise<ParsedTasksResult | ParseError> => {
  if (!GROQ_API_KEY) return { error: "groq_not_configured" };

  const prompt = buildPrompt(transcript, language);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            'You are a precise task parser. Return only valid JSON with a "tasks" array. Never use markdown fences.',
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    return { error: `groq_api_error: ${response.status}` };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return { error: "empty_response" };

  const parsed = JSON.parse(content);

  if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
    return {
      tasks: parsed.tasks.map((t: Record<string, unknown>) => normalizeTask(t, transcript)),
    };
  }

  // Fallback: LLM returned old single-object shape
  return { tasks: [normalizeTask(parsed, transcript)] };
};

const parseFalOpenRouter = async (
  transcript: string,
  language: string,
): Promise<ParsedTasksResult | ParseError> => {
  if (!FAL_KEY) return { error: "fal_not_configured" };

  const prompt = buildPrompt(transcript, language);

  const falResult = await runFalQueueJob<{ output?: string; error?: string }>(
    FAL_MODELS.openrouter,
    {
      model: FAL_PARSE_MODEL,
      system_prompt:
        'You are a precise task parser. Reply with ONLY one JSON object (no markdown fences). It must have a "tasks" array where each item has: title, date, time, category, recurrence, priority.',
      prompt,
      temperature: 0.1,
      max_tokens: 500,
    },
    60_000,
  );

  if ("error" in falResult) {
    return { error: falResult.error };
  }

  const out = falResult.data.output?.trim();
  if (!out) return { error: "empty_fal_output" };

  try {
    const parsed = JSON.parse(stripJsonFences(out));

    if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
      return {
        tasks: parsed.tasks.map((t: Record<string, unknown>) => normalizeTask(t, transcript)),
      };
    }

    // Fallback: LLM returned old single-object shape
    return { tasks: [normalizeTask(parsed, transcript)] };
  } catch {
    return { error: "fal_json_parse_failed" };
  }
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const { user, response: authError } = await getUserFromRequest(request);
  if (authError) return authError;
  if (!user) return json({ error: "unauthorized" }, 401);

  if (!FAL_KEY && !GROQ_API_KEY) {
    return json({ error: "llm_not_configured" }, 503);
  }

  try {
    const { transcript, language } = await request.json();
    if (!transcript) return badRequest("transcript required");

    // Prefer Fal (openrouter) when FAL_KEY is set — uses your Fal balance
    if (FAL_KEY) {
      const falParsed = await parseFalOpenRouter(transcript, language ?? "tr");
      if (!("error" in falParsed)) {
        return json({ tasks: falParsed.tasks });
      }
      // Fal failed — fall back to Groq if configured
      if (GROQ_API_KEY) {
        const groqParsed = await parseGroq(transcript, language ?? "tr");
        if (!("error" in groqParsed)) {
          return json({ tasks: groqParsed.tasks });
        }
        return serverError("parse_failed", `${falParsed.error}; ${groqParsed.error}`);
      }
      return serverError("fal_parse_failed", falParsed.error);
    }

    const groqParsed = await parseGroq(transcript, language ?? "tr");
    if ("error" in groqParsed) {
      return serverError("parse_voice_llm_failed", groqParsed.error);
    }

    return json({ tasks: groqParsed.tasks });
  } catch (err) {
    return serverError("parse_voice_llm_failed", String(err));
  }
});
