import { router } from "expo-router";
import { useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppleLogo, UserCircle } from "phosphor-react-native";
import { useSessionStore } from "@state/useSessionStore";
import { useFTUEStore } from "@state/useFTUEStore";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

export default function AuthScreen() {
  const { setAuthenticated } = useSessionStore();
  const completeAccountGate = useFTUEStore((s) => s.completeAccountGate);
  const [isLoading, setIsLoading] = useState(false);

  const handleAppleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setTimeout(() => {
      setAuthenticated(true);
      completeAccountGate(false);
      setIsLoading(false);
      router.replace("/(onboarding)/name");
    }, 700);
  };

  const handleGuestContinue = () => {
    setAuthenticated(true);
    completeAccountGate(true);
    router.replace("/(onboarding)/name");
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoArea}>
        <View style={styles.logoDot} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Hoş geldiniz</Text>
        <Text style={styles.sub}>
          DayFrame ile gününüzü planlayın ve anılarınızı görselleştirin.
        </Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.appleButton, isLoading && styles.disabled, shadow.soft]}
          onPress={handleAppleSignIn}
          disabled={isLoading}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Apple ile devam et"
        >
          <AppleLogo size={20} color={semantic.textOnDark} weight="fill" />
          <Text style={styles.appleButtonText}>
            {isLoading ? "Bağlanıyor..." : "Apple ile Devam Et"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestButton}
          onPress={handleGuestContinue}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Misafir olarak devam et"
        >
          <UserCircle size={18} color={semantic.textSecondary} />
          <Text style={styles.guestButtonText}>Şimdilik Misafir Devam Et</Text>
        </TouchableOpacity>

        <View style={styles.legalRow}>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://example.com/terms")}
            accessibilityRole="link"
          >
            <Text style={styles.legalLink}>Kullanım Koşulları</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>•</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://example.com/privacy")}
            accessibilityRole="link"
          >
            <Text style={styles.legalLink}>Gizlilik Politikası</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.appBackground,
    paddingHorizontal: spacing.xl,
  },
  logoArea: { paddingTop: 74, alignItems: "flex-start" },
  logoDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: semantic.heroStart,
  },
  content: { flex: 1, justifyContent: "center", gap: spacing.sm },
  title: {
    fontSize: 44,
    lineHeight: 46,
    fontWeight: "700",
    color: semantic.textPrimary,
    letterSpacing: -0.8,
  },
  sub: {
    fontSize: 17,
    lineHeight: 24,
    color: semantic.textSecondary,
    maxWidth: "92%",
  },
  bottom: { paddingBottom: 48, gap: spacing.sm },
  appleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: semantic.heroStart,
    borderRadius: radius.lg,
    paddingVertical: 17,
  },
  appleButtonText: {
    color: semantic.textOnDark,
    fontSize: 16,
    fontWeight: "700",
  },
  guestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: semantic.border,
    backgroundColor: semantic.screenSurface,
  },
  guestButtonText: {
    color: semantic.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  legalRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.xs,
  },
  legalLink: { color: semantic.textSecondary, fontSize: 13 },
  legalSeparator: { color: semantic.textSecondary, fontSize: 13 },
  disabled: { opacity: 0.5 },
});
