import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/* ── Inline: http helpers ── */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-idempotency-key, x-fal-signature",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const methodNotAllowed = () => json({ error: "method_not_allowed" }, 405);
const unauthorized = () => json({ error: "unauthorized" }, 401);
const serverError = (message: string, details?: unknown) =>
  json({ error: "server_error", message, details }, 500);

/* ── Inline: supabase clients ── */
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

const clientFromRequest = (request: Request) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: request.headers.get("Authorization") ?? "" },
    },
  });

/* ── Inline: getUserFromRequest ── */
const getUserFromRequest = async (request: Request) => {
  const client = clientFromRequest(request);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { client: null, user: null, response: unauthorized() };
  return { client, user: data.user, response: null };
};

/* ── Helper ── */
const signUrl = async (bucket: string, path: string | null): Promise<string | null> => {
  if (!path) return null;
  const { data } = await adminClient.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "GET" && request.method !== "POST") return methodNotAllowed();

  const { user, response } = await getUserFromRequest(request);
  if (response || !user) return response!;

  try {
    const { data: homeState, error } = await adminClient.rpc("compute_home_state", {
      p_user_id: user.id,
    });

    if (error) return serverError("home_state_compute_failed", error.message);

    const avatarSummary = homeState?.avatarSummary;
    if (avatarSummary?.id) {
      const { data: avatar } = await adminClient
        .from("avatars")
        .select("storage_path")
        .eq("id", avatarSummary.id)
        .maybeSingle();

      if (avatar?.storage_path) {
        const signedUrl = await signUrl("avatars-private", avatar.storage_path);
        if (signedUrl) homeState.avatarSummary.signedUrl = signedUrl;
      }
    }

    const starterHeroSummary = homeState?.starterHeroSummary;
    if (starterHeroSummary?.id) {
      const { data: starterHero } = await adminClient
        .from("avatars")
        .select("storage_path")
        .eq("id", starterHeroSummary.id)
        .maybeSingle();

      if (starterHero?.storage_path) {
        const signedUrl = await signUrl("avatars-private", starterHero.storage_path);
        if (signedUrl) homeState.starterHeroSummary.signedUrl = signedUrl;
      }
    }

    const hero = homeState?.hero;
    if (hero?.state === "visual_ready") {
      const { data: visual } = await adminClient
        .from("daily_visuals")
        .select("storage_path")
        .eq("user_id", user.id)
        .eq("is_hero_active", true)
        .order("visual_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (visual?.storage_path) {
        const signedUrl = await signUrl("daily-visuals-private", visual.storage_path);
        if (signedUrl) homeState.hero.signedVisualUrl = signedUrl;
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: todayTasks } = await adminClient
      .from("todos")
      .select("id, title, kind, category, priority, is_completed, due_date, recurrence")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .or(`due_date.eq.${today},due_date.is.null,recurrence.neq.once`)
      .order("created_at", { ascending: false })
      .limit(20);

    homeState.todayTasks = todayTasks ?? [];

    const { data: onboardingSteps } = await adminClient
      .from("onboarding_progress")
      .select("step_key, status")
      .eq("user_id", user.id);

    homeState.onboardingSummary = {
      steps: onboardingSteps ?? [],
      completed: homeState.userSummary?.onboardingCompleted ?? false,
    };

    return json(homeState);
  } catch (error) {
    return serverError("home_state_error", String(error));
  }
});
