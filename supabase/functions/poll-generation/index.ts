import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { badRequest, corsHeaders, json, methodNotAllowed, serverError } from "../_shared/http.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "GET" && request.method !== "POST") return methodNotAllowed();

  const { client, user, response } = await getUserFromRequest(request);
  if (response || !client || !user) return response;

  const url = new URL(request.url);
  let jobId = url.searchParams.get("jobId");
  if (!jobId && request.method === "POST") {
    try {
      const body = await request.json();
      if (typeof body?.jobId === "string") jobId = body.jobId;
    } catch {
      // Ignore body parse errors, handled by required job id check.
    }
  }
  if (!jobId) return badRequest("job_id_required");

  try {
    const { data: job, error: jobError } = await client
      .from("generation_jobs")
      .select(
        "id, job_type, status, attempts, max_attempts, last_error, provider_job_id, visual_id, created_at, updated_at, finished_at",
      )
      .eq("id", jobId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (jobError) return serverError("job_fetch_failed", jobError.message);
    if (!job) return json({ error: "not_found" }, 404);

    let visual = null;
    if (job.visual_id) {
      const { data: foundVisual } = await client
        .from("generated_visuals")
        .select("id, image_url, thumbnail_url, style_used, generation_date, status, created_at")
        .eq("id", job.visual_id)
        .eq("user_id", user.id)
        .maybeSingle();
      visual = foundVisual ?? null;
    }

    const recommendedPollAfterMs =
      job.status === "pending" || job.status === "leased" || job.status === "processing" ? 5000 : 0;

    return json({
      job,
      visual,
      recommendedPollAfterMs,
    });
  } catch (error) {
    return serverError("unexpected_poll_error", String(error));
  }
});
