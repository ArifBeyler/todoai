import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "replace-with-anon-key";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
