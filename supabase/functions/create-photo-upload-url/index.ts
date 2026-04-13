import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { requirePremium } from "../_shared/premium.ts";
import { badRequest, corsHeaders, json, methodNotAllowed, serverError } from "../_shared/http.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();

  const { user, response } = await getUserFromRequest(request);
  if (response || !user) return response;

  const sub = await requirePremium(user.id);

  // Allow first upload during onboarding even if subscription hasn't propagated yet
  if (!sub) {
    const { count: existingPhotos } = await adminClient
      .from("photo_uploads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((existingPhotos ?? 0) > 0) {
      return json({ error: "premium_required" }, 403);
    }
  }

  // Ensure face_processing consent exists (auto-create via adminClient for onboarding)
  let consent: { id: string } | null = null;
  const { data: existingConsent } = await adminClient
    .from("user_consents")
    .select("id")
    .eq("user_id", user.id)
    .eq("consent_type", "face_processing")
    .eq("granted", true)
    .maybeSingle();

  if (existingConsent) {
    consent = existingConsent;
  } else {
    const { data: newConsent, error: consentError } = await adminClient
      .from("user_consents")
      .upsert(
        {
          user_id: user.id,
          consent_type: "face_processing",
          consent_version: "v1",
          granted: true,
          granted_at: new Date().toISOString(),
          source: "mobile",
        },
        { onConflict: "user_id,consent_type,consent_version" },
      )
      .select("id")
      .single();

    if (consentError || !newConsent) {
      return serverError("consent_creation_failed", consentError?.message);
    }
    consent = newConsent;
  }

  // Daily upload limit
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await adminClient
    .from("photo_uploads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", `${today}T00:00:00Z`);

  if ((count ?? 0) >= 5) {
    return json({ error: "daily_upload_limit_reached", limit: 5 }, 429);
  }

  const photoId = crypto.randomUUID();
  const storagePath = `${user.id}/${photoId}.jpg`;

  const { data: signedUrl, error: signError } = await adminClient.storage
    .from("face-raw-private")
    .createSignedUploadUrl(storagePath);

  if (signError || !signedUrl) {
    return serverError("signed_url_failed", signError?.message);
  }

  return json({
    uploadUrl: signedUrl.signedUrl,
    token: signedUrl.token,
    photoId,
    storagePath,
    bucket: "face-raw-private",
    consentId: consent.id,
  });
});
