import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Sparkle } from "phosphor-react-native";
import { useFTUEStore } from "@state/useFTUEStore";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

export default function FeatureTwoScreen() {
  const completeSlidesOnboarding = useFTUEStore(
    (s) => s.completeSlidesOnboarding,
  );

  const handleContinue = () => {
    completeSlidesOnboarding();
    router.push("/auth");
  };

  return (
    <View style={styles.container}>
      <View style={styles.steps}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>
      <View style={[styles.iconWrap, shadow.card]}>
        <Sparkle size={42} color={semantic.accent} weight="fill" />
      </View>
      <Text style={styles.title}>{"Yapay zekâ\nsizinle üretir"}</Text>
      <Text style={styles.description}>
        Seçtiğiniz stile göre günlük görevlere özel, size benzeyen sahneler
        oluşturur.
      </Text>
      <TouchableOpacity
        style={[styles.button, shadow.soft]}
        onPress={handleContinue}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Devam et"
      >
        <Text style={styles.buttonText}>Devam Et</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.appBackground,
    paddingHorizontal: spacing.xl,
    paddingTop: 74,
    paddingBottom: 50,
  },
  steps: { flexDirection: "row", gap: 6, marginBottom: 40 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: semantic.border,
  },
  dotActive: { width: 24, backgroundColor: semantic.heroStart },
  iconWrap: {
    width: 82,
    height: 82,
    borderRadius: radius.lg,
    backgroundColor: semantic.screenSurface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 38,
    lineHeight: 40,
    fontWeight: "700",
    color: semantic.textPrimary,
    letterSpacing: -0.8,
  },
  description: {
    marginTop: spacing.sm,
    fontSize: 17,
    lineHeight: 24,
    color: semantic.textSecondary,
    maxWidth: "94%",
  },
  button: {
    marginTop: "auto",
    borderRadius: radius.lg,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    paddingVertical: 17,
  },
  buttonText: {
    color: semantic.textOnDark,
    fontSize: 16,
    fontWeight: "700",
  },
});
