import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "replace-with-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const ensureAnonymousSession = async (): Promise<boolean> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) return true;

    const { error } = await supabase.auth.signInAnonymously();
    return !error;
  } catch {
    return false;
  }
};

export type AppleSignInResult = {
  success: boolean;
  fullName?: string | null;
  error?: string;
};

export const signInWithApple = async (): Promise<AppleSignInResult> => {
  try {
    const rawNonce = Array.from(Crypto.getRandomBytes(32))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      return { success: false, error: "no_identity_token" };
    }

    const givenName = credential.fullName?.givenName ?? "";
    const familyName = credential.fullName?.familyName ?? "";
    const fullName = [givenName, familyName].filter(Boolean).join(" ") || null;

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
      nonce: rawNonce,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, fullName };
  } catch (err: any) {
    if (err?.code === "ERR_REQUEST_CANCELED") {
      return { success: false, error: "cancelled" };
    }
    return { success: false, error: err?.message ?? "unknown_error" };
  }
};
