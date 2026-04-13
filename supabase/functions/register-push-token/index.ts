import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { badRequest, corsHeaders, json, methodNotAllowed, serverError } from "../_shared/http.ts";

type RegisterBody = {
  token: string;
  platform?: string;
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const { user, response } = await getUserFromRequest(request);
  if (response || !user) return response;

  let body: RegisterBody;
  try {
    body = await request.json();
  } catch {
    return badRequest("invalid_json");
  }

  if (!body.token || body.token.trim().length === 0) {
    return badRequest("token_required");
  }

  const platform = body.platform ?? "ios";

  try {
    const { data, error } = await adminClient
      .from("notification_tokens")
      .upsert(
        {
          user_id: user.id,
          token: body.token.trim(),
          platform,
          is_active: true,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "user_id,token" },
      )
      .select("id")
      .single();

    if (error) return serverError("token_register_failed", error.message);

    // Deactivate other tokens for the same platform (single device per platform)
    await adminClient
      .from("notification_tokens")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("platform", platform)
      .neq("token", body.token.trim());

    return json({ status: "registered", tokenId: data.id });
  } catch (error) {
    return serverError("register_token_error", String(error));
  }
});
