import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient } from "../_shared/supabase.ts";
import { corsHeaders, json, methodNotAllowed, serverError } from "../_shared/http.ts";
import { trackBackendEvent } from "../_shared/analytics.ts";

const CRON_SECRET = Deno.env.get("CRON_SECRET");
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_MODEL = "llama-3.1-8b-instant";

type UserTodoSummary = {
  userId: string;
  displayName: string;
  productiveTime: string;
  categories: Record<string, number>;
  incompleteTitles: string[];
  recentCompletedTitles: string[];
  previousSuggestions: string[];
};

const buildPrompt = (summary: UserTodoSummary): string => {
  const catBreakdown = Object.entries(summary.categories)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, count]) => `${cat}: ${count}`)
    .join(", ");

  return `Sen kişisel üretkenlik asistanısın. Türkçe konuşan bir kullanıcının son 30 günlük görev geçmişine göre tam olarak BİR yeni görev öner.

Öneri kuralları:
- Spesifik ve uygulanabilir olmalı
- Kullanıcının alışkanlıklarına uygun ama farklılık da içermeli
- Önceki önerileri tekrarlama
- Sadece JSON döndür, başka bir şey yazma

Kullanıcı: ${summary.displayName}
Verimli saatler: ${summary.productiveTime || "belirtilmemiş"}
Kategori dağılımı: ${catBreakdown || "henüz veri yok"}
Tamamlanmamış görevler: ${summary.incompleteTitles.slice(0, 10).join(", ") || "yok"}
Son tamamlanan: ${summary.recentCompletedTitles.slice(0, 5).join(", ") || "yok"}
ÖNCEKİ ÖNERİLER (bunları önerme): ${summary.previousSuggestions.join(", ") || "yok"}

JSON formatı: {"title": "görev başlığı", "category": "kategori", "reason_tr": "neden bu öneri", "tone": "practical|habit|emotional"}`;
};

const callGroqAPI = async (prompt: string): Promise<{ title: string; category: string; reason_tr: string; tone: string } | null> => {
  if (!GROQ_API_KEY) return null;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "Sen bir görev önerme asistanısın. Sadece JSON döndür." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content);
  } catch {
    return null;
  }
};

const FALLBACK_SUGGESTIONS = [
  { title: "10 dakika kitap oku", category: "selfcare", reason_tr: "Kişisel gelişim için", tone: "habit" },
  { title: "Su içmeyi unutma", category: "health", reason_tr: "Sağlık alışkanlığı", tone: "habit" },
  { title: "Masanı düzenle", category: "home", reason_tr: "Temiz ortam, temiz zihin", tone: "practical" },
  { title: "5 dakika nefes egzersizi yap", category: "selfcare", reason_tr: "Stres azaltmak için", tone: "emotional" },
  { title: "Yarınki kıyafetlerini hazırla", category: "home", reason_tr: "Sabah rutinini kolaylaştır", tone: "practical" },
];

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  if (CRON_SECRET && request.headers.get("x-cron-secret") !== CRON_SECRET) {
    return json({ error: "unauthorized" }, 401);
  }

  try {
    const { data: users, error: usersError } = await adminClient
      .from("users")
      .select("id, display_name, name")
      .eq("onboarding_completed", true);

    if (usersError) return serverError("users_fetch_failed", usersError.message);
    if (!users || users.length === 0) return json({ generated: 0 });

    let generated = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      const { data: prefs } = await adminClient
        .from("user_preferences")
        .select("suggestion_frequency_days")
        .eq("user_id", user.id)
        .maybeSingle();

      const frequencyDays = prefs?.suggestion_frequency_days ?? 3;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - frequencyDays);

      const { data: recentSuggestion } = await adminClient
        .from("ai_suggestions")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", cutoffDate.toISOString())
        .limit(1)
        .maybeSingle();

      if (recentSuggestion) {
        skipped++;
        continue;
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: todos } = await adminClient
        .from("todos")
        .select("title, category, is_completed, created_at")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (!todos || todos.length < 2) {
        skipped++;
        continue;
      }

      const categories: Record<string, number> = {};
      const incompleteTitles: string[] = [];
      const completedTitles: string[] = [];

      for (const todo of todos) {
        categories[todo.category] = (categories[todo.category] ?? 0) + 1;
        if (!todo.is_completed) incompleteTitles.push(todo.title);
        else completedTitles.push(todo.title);
      }

      const { data: prevSuggestions } = await adminClient
        .from("ai_suggestions")
        .select("suggestion_payload")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const previousTitles = (prevSuggestions ?? [])
        .map((s: { suggestion_payload: { title?: string } }) => s.suggestion_payload?.title)
        .filter(Boolean) as string[];

      const { data: session } = await adminClient
        .from("users")
        .select("style_preference, generation_frequency")
        .eq("id", user.id)
        .maybeSingle();

      const summary: UserTodoSummary = {
        userId: user.id,
        displayName: user.display_name ?? user.name ?? "",
        productiveTime: "",
        categories,
        incompleteTitles,
        recentCompletedTitles: completedTitles,
        previousSuggestions: previousTitles,
      };

      const prompt = buildPrompt(summary);
      let suggestion = await callGroqAPI(prompt);

      if (!suggestion) {
        const fallback = FALLBACK_SUGGESTIONS[Math.floor(Math.random() * FALLBACK_SUGGESTIONS.length)];
        const isRepeat = previousTitles.some(
          (t) => t.toLowerCase() === fallback.title.toLowerCase(),
        );
        if (isRepeat) {
          failed++;
          continue;
        }
        suggestion = fallback;
      }

      await adminClient.from("ai_suggestions").insert({
        user_id: user.id,
        suggestion_type: "task",
        suggestion_payload: suggestion,
        tone: suggestion.tone === "emotional" ? "warm" : suggestion.tone === "habit" ? "gentle" : "curious",
        category: suggestion.category,
        reason_text: suggestion.reason_tr,
        source_model: GROQ_API_KEY ? GROQ_MODEL : "fallback",
      });

      generated++;

      await trackBackendEvent(user.id, "ai_suggestion_generated", {
        category: suggestion.category,
        tone: suggestion.tone,
        model: GROQ_API_KEY ? GROQ_MODEL : "fallback",
      });
    }

    return json({ generated, skipped, failed, total: users.length });
  } catch (err) {
    return serverError("schedule_suggestions_failed", String(err));
  }
});
