import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  ZoomIn,
} from "react-native-reanimated";
import { useSessionStore } from "@state/useSessionStore";
import { font, semantic, shadow, spacing } from "@/src/ui/tokens";
import { preHomeMotion } from "@/src/ui/motion";
import { OnboardingProgress } from "@/src/components/OnboardingProgress";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";

// ─── Name → Emoji map ─────────────────────────────────────────────────────────
// Keys: lowercase, Turkish characters preserved.
// Lookup normalizes input the same way before matching.

const NAME_EMOJI_MAP: Record<string, string> = {
  // Türkçe doğa/anlam isimleri
  yağmur: "🌧️",
  güneş: "☀️",
  deniz: "🌊",
  irmak: "🌊",
  nehir: "🌊",
  bora: "🌪️",
  fırtına: "⛈️",
  kar: "❄️",
  bahar: "🌸",
  çiçek: "🌸",
  gül: "🌹",
  lale: "🌷",
  papatya: "🌼",
  aslan: "🦁",
  doğa: "🌿",
  toprak: "🪨",
  ateş: "🔥",
  bulut: "☁️",
  ay: "🌙",
  yıldız: "⭐",
  pınar: "💧",
  rüzgar: "💨",
  rüzgâr: "💨",
  şimşek: "⚡",
  orman: "🌲",
  dağ: "⛰️",
  kaya: "🪨",
  taş: "🪨",
  aydın: "🌟",
  bülbül: "🐦",
  kartal: "🦅",
  şahin: "🦅",
  // English word-names
  luna: "🌙",
  aurora: "🌅",
  jade: "💚",
  amber: "🟠",
  lily: "🌸",
  rose: "🌹",
  violet: "💜",
  iris: "🌸",
  daisy: "🌼",
  hazel: "🌰",
  crystal: "💎",
  hope: "✨",
  grace: "🕊️",
  leo: "🦁",
  hunter: "🏹",
  phoenix: "🦅",
  jasper: "💎",
  rocky: "🪨",
  brook: "🌊",
  river: "🌊",
  storm: "⛈️",
  sky: "🌤️",
  sunny: "☀️",
  rain: "🌧️",
  snow: "❄️",
  winter: "❄️",
  summer: "☀️",
  spring: "🌸",
  autumn: "🍂",
  forest: "🌲",
  ember: "🔥",
  blaze: "🔥",
  dawn: "🌅",
  nova: "✨",
  celeste: "🌌",
  sierra: "⛰️",
  sage: "🌿",
  flora: "🌸",
  terra: "🌍",
  stella: "⭐",
  sol: "☀️",
  marina: "⚓",
  misty: "🌫️",
  meadow: "🌿",
};

/**
 * Normalizes a name string to a consistent lowercase key.
 * Handles Turkish dotted/dotless I correctly.
 */
const normalizeKey = (input: string): string =>
  input
    .trim()
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    // Take only the first word so "Yağmur Kaya" still matches "yağmur"
    .split(/\s+/)[0];

const getNameEmoji = (input: string): string | null =>
  NAME_EMOJI_MAP[normalizeKey(input)] ?? null;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NameScreen() {
  const { profileName, setProfileName } = useSessionStore();
  const [name, setName] = useState(profileName || "");
  const { triggerExit, exitStyle } = useOnboardingExit();

  const emoji = useMemo(() => getNameEmoji(name), [name]);

  const handleContinue = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    // Append the emoji to the stored name when there's a match
    setProfileName(emoji ? `${trimmed} ${emoji}` : trimmed);
    triggerExit("forward", () => router.push("/(onboarding)/goal"));
  };

  const handleBack = () => {
    triggerExit("back", () => router.back());
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Animated.View style={[styles.container, exitStyle]}>
        <View style={[styles.panel, shadow.card]}>
          <OnboardingProgress current={1} total={11} />

          <View style={styles.header}>
            <Animated.Text
              entering={FadeInUp.delay(60).duration(320).springify().damping(18).stiffness(160)}
              style={styles.title}
            >
              Size nasıl{"\n"}hitap edelim?
            </Animated.Text>
            <Animated.Text
              entering={FadeIn.delay(220).duration(280)}
              style={styles.hint}
            >
              Adınızı yazarak başlayın.
            </Animated.Text>
          </View>

          <Animated.View entering={preHomeMotion.sectionEnter(100)}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Adınızı yazın"
              placeholderTextColor={semantic.textSecondary}
              autoFocus={!profileName}
              style={styles.input}
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              accessibilityLabel="Adınız"
            />

            {/* Emoji chip — appears when name matches a known word-name */}
            {emoji ? (
              <Animated.View
                key={emoji}
                entering={ZoomIn.duration(240).springify().damping(14).stiffness(220)}
                exiting={FadeOut.duration(160)}
                style={styles.emojiChip}
              >
                <Text style={styles.emojiGlyph}>{emoji}</Text>
              </Animated.View>
            ) : null}
          </Animated.View>
        </View>

        <Animated.View
          entering={preHomeMotion.ctaEnter(228)}
          style={styles.bottom}
        >
          <OnboardingFooter
            onNext={handleContinue}
            onBack={handleBack}
            nextDisabled={!name.trim()}
            showBack
          />
        </Animated.View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F0",
    paddingTop: 74,
    paddingBottom: 42,
    paddingHorizontal: 14,
  },
  panel: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: "#FAFAF9",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    paddingHorizontal: spacing.xl,
    paddingTop: 28,
    paddingBottom: 20,
  },
  header: {
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -0.8,
  },
  hint: {
    fontSize: 14,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  input: {
    marginTop: 26,
    borderWidth: 1,
    borderColor: semantic.border,
    borderRadius: 14,
    backgroundColor: semantic.screenSurface,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 18,
    color: semantic.textPrimary,
    fontWeight: "600",
    fontFamily: font.semiBold,
  },
  emojiChip: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  emojiGlyph: {
    fontSize: 20,
    lineHeight: 24,
  },
  bottom: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
});
