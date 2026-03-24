import { unauthorized } from "./http.ts";
import { clientFromRequest } from "./supabase.ts";

export const getUserFromRequest = async (request: Request) => {
  const client = clientFromRequest(request);
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    return { client: null, user: null, response: unauthorized() };
  }

  return { client, user: data.user, response: null };
};

