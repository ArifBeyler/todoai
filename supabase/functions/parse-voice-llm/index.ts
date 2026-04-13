import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, json, badRequest, methodNotAllowed, serverError } from "../_shared/http.ts";
import { getUserFromRequest } from "../_shared/auth.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_MODEL = "llama-3.1-8b-instant";

const buildPrompt = (transcript: string, language: string): string => {
  const lang = language === "en" ? "English" : "Turkish";
  return `Parse this ${lang} voice command into a structured todo task. Extract:
- title: the main task (cleaned, without time/date fragments)
- date: ISO date string (YYYY-MM-DD) if mentioned, null otherwise
- time: HH:mm format if mentioned, null otherwise
- category: one of [work, health, home, shopping, social, education, fitness, selfcare, errands, finance, pet, other]
- recurrence: one of [once, daily, weekly, weekend] if mentioned, "once" otherwise
- priority: one of [low, medium, high] based on urgency, default "medium"

Voice input: "${transcript}"

Return ONLY valid JSON with these exact fields. No explanation.`;
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const { user, response: authError } = await getUserFromRequest(request);
  if (authError) return authError;
  if (!user) return json({ error: "unauthorized" }, 401);

  if (!GROQ_API_KEY) {
    return json({ error: "llm_not_configured" }, 503);
  }

  try {
    const { transcript, language } = await request.json();
    if (!transcript) return badRequest("transcript required");

    const prompt = buildPrompt(transcript, language ?? "tr");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are a precise task parser. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return serverError("groq_api_error", `Status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return serverError("empty_response", "No content from LLM");
    }

    const parsed = JSON.parse(content);

    return json({
      title: parsed.title ?? transcript,
      date: parsed.date ?? null,
      time: parsed.time ?? null,
      category: parsed.category ?? "other",
      recurrence: parsed.recurrence ?? "once",
      priority: parsed.priority ?? "medium",
    });
  } catch (err) {
    return serverError("parse_voice_llm_failed", String(err));
  }
});
