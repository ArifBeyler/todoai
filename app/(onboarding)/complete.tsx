import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CheckCircle } from "phosphor-react-native";
import { useSessionStore } from "@state/useSessionStore";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

export default function CompleteScreen() {
  const { profileName, completeOnboarding } = useSessionStore();

  const handleFinish = () => {
    completeOnboarding();
    router.replace("/(tabs)/home");
  };

  return (
    <View style={styles.container}>
      <CheckCircle size={72} color={semantic.heroStart} weight="fill" />
      <Text style={styles.title}>
        {"Harika, " + (profileName || "merhaba") + "!\nHer şey hazır."}
      </Text>
      <Text style={styles.sub}>
        İlk görevini ekle, DayFrame sana özel günün görselini üretsin.
      </Text>

      <View style={styles.hintCard}>
        <Text style={styles.hintTitle}>Nasıl çalışır?</Text>
        <Text style={styles.hintText}>
          3 görev ekle → fotoğrafını yükle → kişisel AI görselin hazırlansın.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, shadow.soft]}
        onPress={handleFinish}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Ana sayfaya geç"
      >
        <Text style={styles.buttonText}>Başlayalım</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.appBackground,
    paddingHorizontal: spacing.xl,
    paddingTop: 90,
    paddingBottom: 52,
    alignItems: "center",
  },
  title: {
    marginTop: spacing.lg,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "700",
    color: semantic.textPrimary,
    textAlign: "center",
    letterSpacing: -0.7,
  },
  sub: {
    marginTop: spacing.sm,
    fontSize: 16,
    lineHeight: 23,
    color: semantic.textSecondary,
    textAlign: "center",
  },
  hintCard: {
    marginTop: spacing.xxl,
    width: "100%",
    borderRadius: radius.lg,
    backgroundColor: semantic.screenSurface,
    borderWidth: 1,
    borderColor: semantic.border,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  hintTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: semantic.textPrimary,
  },
  hintText: {
    fontSize: 14,
    lineHeight: 20,
    color: semantic.textSecondary,
  },
  button: {
    marginTop: "auto",
    width: "100%",
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
