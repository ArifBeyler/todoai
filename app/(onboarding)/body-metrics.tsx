import { router } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { Ruler, Scales } from "phosphor-react-native";
import { useSessionStore, deriveHydrationGoalMl } from "@state/useSessionStore";
import { font, semantic, spacing } from "@/src/ui/tokens";
import { preHomeMotion } from "@/src/ui/motion";
import {
  OnboardingStaggeredParagraph,
  countStaggerSteps,
} from "@/src/components/OnboardingStaggeredText";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import { OnboardingProgress } from "@/src/components/OnboardingProgress";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";

const LAYER = {
  bg: "#F2F2F0",
  panel: "#FAFAF9",
  inset: "#EDEDEB",
  border: "rgba(0,0,0,0.04)",
  borderStrong: "rgba(0,0,0,0.08)",
  text: "#111111",
  textMuted: "rgba(17,17,17,0.55)",
} as const;

const CARD_SHADOW = {
  shadowColor: "rgba(0,0,0,0.06)",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 1,
  shadowRadius: 24,
  elevation: 6,
} as const;

/**
 * Onboarding — Body Metrics Screen
 *
 * Collects height (cm) and weight (kg) to derive the user's personalised
 * daily hydration goal. Both fields are optional — the user can skip.
 *
 * Inserted after `prod-time` and before `hydration-goal`.
 */
export default function BodyMetricsScreen() {
  const { setHeightCm, setWeightKg, setHydrationGoalMl } = useSessionStore();
  const [heightInput, setHeightInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const { triggerExit, exitStyle } = useOnboardingExit();

  const parsedHeight = parseFloat(heightInput.replace(",", "."));
  const parsedWeight = parseFloat(weightInput.replace(",", "."));

  const isHeightValid = !heightInput || (parsedHeight >= 100 && parsedHeight <= 250);
  const isWeightValid = !weightInput || (parsedWeight >= 30 && parsedWeight <= 250);
  const hasAnyInput = !!heightInput || !!weightInput;

  const handleContinue = () => {
    const h = isHeightValid && heightInput ? parsedHeight : null;
    const w = isWeightValid && weightInput ? parsedWeight : null;

    setHeightCm(h);
    setWeightKg(w);

    // Pre-compute hydration goal so the next screen can display it immediately
    const goal = deriveHydrationGoalMl(w, h);
    setHydrationGoalMl(goal);

    triggerExit("forward", () => router.push("/(onboarding)/hydration-goal"));
  };

  const handleSkip = () => {
    setHeightCm(null);
    setWeightKg(null);
    setHydrationGoalMl(null);
    triggerExit("forward", () => router.push("/(onboarding)/hydration-goal"));
  };

  const handleBack = () => {
    triggerExit("back", () => router.back());
  };

  const titleStr = "Vücut ölçülerin\nneler?";
  const subStr =
    "Günlük su hedefini hesaplamak için kullanacağız. İstersen atlayabilirsin.";
  const ts = 34;
  const titleSteps = countStaggerSteps(titleStr);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View style={[styles.container, exitStyle]}>
          <View style={[styles.panel, CARD_SHADOW]}>
            <OnboardingProgress current={11} total={13} />

            <View style={styles.header}>
              <OnboardingStaggeredParagraph
                text={titleStr}
                style={styles.title}
                staggerMs={ts}
              />
              <OnboardingStaggeredParagraph
                text={subStr}
                style={styles.sub}
                startDelay={titleSteps * ts + 60}
                staggerMs={22}
                containerStyle={{ marginTop: 8 }}
              />
            </View>

            <View style={styles.formCenter}>
              <View style={styles.form}>
                {/* Height input */}
                <Animated.View
                  entering={preHomeMotion.cardEnter(200)}
                  style={styles.inputGroup}
                >
                  <View style={styles.inputLabelRow}>
                    <View style={styles.inputIcon}>
                      <Ruler size={16} color={LAYER.textMuted} />
                    </View>
                    <Text style={styles.inputLabel}>Boy (cm)</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      !isHeightValid && heightInput ? styles.inputError : undefined,
                    ]}
                    value={heightInput}
                    onChangeText={setHeightInput}
                    placeholder="175"
                    placeholderTextColor={LAYER.textMuted}
                    keyboardType="numeric"
                    returnKeyType="next"
                    maxLength={3}
                    accessibilityLabel="Boy (santimetre)"
                  />
                  {!isHeightValid && heightInput ? (
                    <Text style={styles.errorText}>100–250 cm arası gir</Text>
                  ) : null}
                </Animated.View>

                {/* Weight input */}
                <Animated.View
                  entering={preHomeMotion.cardEnter(280)}
                  style={styles.inputGroup}
                >
                  <View style={styles.inputLabelRow}>
                    <View style={styles.inputIcon}>
                      <Scales size={16} color={LAYER.textMuted} />
                    </View>
                    <Text style={styles.inputLabel}>Kilo (kg)</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      !isWeightValid && weightInput ? styles.inputError : undefined,
                    ]}
                    value={weightInput}
                    onChangeText={setWeightInput}
                    placeholder="70"
                    placeholderTextColor={LAYER.textMuted}
                    keyboardType="numeric"
                    returnKeyType="done"
                    maxLength={3}
                    onSubmitEditing={Keyboard.dismiss}
                    accessibilityLabel="Kilo (kilogram)"
                  />
                  {!isWeightValid && weightInput ? (
                    <Text style={styles.errorText}>30–250 kg arası gir</Text>
                  ) : null}
                </Animated.View>

                {hasAnyInput && isHeightValid && isWeightValid && (
                  <Animated.View
                    entering={preHomeMotion.cardEnter(0)}
                    style={styles.previewPill}
                  >
                    <Text style={styles.previewText}>
                      Tahmini su hedefin:{" "}
                      <Text style={styles.previewValue}>
                        {deriveHydrationGoalMl(
                          weightInput ? parsedWeight : null,
                          heightInput ? parsedHeight : null,
                        )
                          ? `${deriveHydrationGoalMl(
                              weightInput ? parsedWeight : null,
                              heightInput ? parsedHeight : null,
                            )! / 1000} L`
                          : "—"}
                      </Text>
                    </Text>
                  </Animated.View>
                )}
              </View>
            </View>
          </View>

          <Animated.View
            entering={preHomeMotion.ctaEnter(380)}
            style={styles.bottom}
          >
            <OnboardingFooter
              onNext={handleContinue}
              onBack={handleBack}
              nextDisabled={
                (!!heightInput && !isHeightValid) ||
                (!!weightInput && !isWeightValid)
              }
              showBack
            />
            <TouchableOpacity
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel="Şimdilik atla"
            >
              <Text style={styles.skip}>Şimdilik Atla</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LAYER.bg,
    paddingTop: 74,
    paddingBottom: 42,
    paddingHorizontal: 14,
  },
  panel: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: LAYER.panel,
    borderWidth: 1,
    borderColor: LAYER.border,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    fontFamily: font.bold,
    color: LAYER.text,
    letterSpacing: -0.5,
  },
  sub: {
    marginTop: 6,
    fontSize: 15,
    fontFamily: font.regular,
    color: LAYER.textMuted,
    lineHeight: 21,
  },
  formCenter: {
    flex: 1,
    justifyContent: "center",
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inputIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: font.semiBold,
    color: LAYER.text,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: LAYER.borderStrong,
    backgroundColor: LAYER.panel,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: font.regular,
    color: LAYER.text,
  },
  inputError: {
    borderColor: "#E05555",
  },
  errorText: {
    fontSize: 12,
    fontFamily: font.regular,
    color: "#E05555",
    marginTop: 2,
  },
  previewPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  previewText: {
    fontSize: 13,
    fontFamily: font.regular,
    color: LAYER.textMuted,
  },
  previewValue: {
    fontWeight: "700",
    fontFamily: font.bold,
    color: LAYER.text,
  },
  bottom: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: 8,
    alignItems: "center",
  },
  skip: {
    textAlign: "center",
    color: semantic.textSecondary,
    fontSize: 14,
    fontFamily: font.regular,
    paddingVertical: 4,
  },
});
