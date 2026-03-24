export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-idempotency-key, x-fal-signature",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

export const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

export const methodNotAllowed = () => json({ error: "method_not_allowed" }, 405);

export const unauthorized = () => json({ error: "unauthorized" }, 401);

export const badRequest = (message: string, details?: unknown) =>
  json({ error: "bad_request", message, details }, 400);

export const serverError = (message: string, details?: unknown) =>
  json({ error: "server_error", message, details }, 500);

