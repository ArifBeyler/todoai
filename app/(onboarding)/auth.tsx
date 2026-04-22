import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";
import * as AppleAuthentication from "expo-apple-authentication";
import { DeviceMobile, ShieldCheck } from "phosphor-react-native";
import { signInWithApple, ensureAnonymousSession } from "@/src/services/supabase";
import { useSessionStore } from "@state/useSessionStore";
import { useFTUEStore } from "@state/useFTUEStore";
import { font, radius, semantic, shadow, spacing } from "@/src/ui/tokens";
import { preHomeMotion } from "@/src/ui/motion";
import {
  OnboardingStaggeredParagraph,
  countStaggerSteps,
} from "@/src/components/OnboardingStaggeredText";

export default function AuthScreen() {
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isDeviceLoading, setIsDeviceLoading] = useState(false);
  const setProfileName = useSessionStore((s) => s.setProfileName);
  const completeAccountGate = useFTUEStore((s) => s.completeAccountGate);
  const { triggerExit, exitStyle } = useOnboardingExit();

  const isLoading = isAppleLoading || isDeviceLoading;

  const nextRouteAfterAuth = (): "/(onboarding)/photo" | "/(onboarding)/free-intro" => {
    const { isPremium } = useSessionStore.getState();
    const { paywallInteraction } = useFTUEStore.getState();
    return isPremium || paywallInteraction === "subscribed"
      ? "/(onboarding)/photo"
      : "/(onboarding)/free-intro";
  };

  const handleAppleSignIn = async () => {
    if (isLoading) return;
    setIsAppleLoading(true);

    const result = await signInWithApple();

    setIsAppleLoading(false);

    if (result.success) {
      if (result.fullName) {
        setProfileName(result.fullName);
      }
      completeAccountGate(false);
      const next = nextRouteAfterAuth();
      triggerExit("forward", () => router.push(next));
      return;
    }

    if (result.error === "cancelled") return;

    Alert.alert(
      "Giriş Başarısız",
      "Apple ile giriş yapılamadı. Lütfen tekrar deneyin.",
      [{ text: "Tamam" }],
    );
  };

  const handleDeviceSignIn = async () => {
    if (isLoading) return;
    setIsDeviceLoading(true);

    const success = await ensureAnonymousSession();

    setIsDeviceLoading(false);

    if (success) {
      completeAccountGate(true);
      const next = nextRouteAfterAuth();
      triggerExit("forward", () => router.push(next));
      return;
    }

    Alert.alert(
      "Bağlantı Hatası",
      "Oturum oluşturulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.",
      [{ text: "Tamam" }],
    );
  };

  const titleStr = "Hesabını oluştur\nve devam et";
  const descStr =
    "Görevlerin, hatırlatıcıların ve tercihlerin güvenli bir şekilde senkronlansın.";
  const trustStr = "Verileriniz şifreli olarak korunur";
  const st = 31;
  const titleSteps = countStaggerSteps(titleStr);
  const descSteps = countStaggerSteps(descStr);
  const trustStartDelay =
    titleSteps * st + 71 + descSteps * 23 + 86;

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      <View style={[styles.panel, shadow.card]}>
        <Animated.View entering={preHomeMotion.screenEnter} style={styles.top}>
          <View style={[styles.iconWrap, shadow.soft]}>
            <ShieldCheck size={28} color={semantic.heroStart} weight="duotone" />
          </View>
        </Animated.View>

        <View style={styles.content}>
          <OnboardingStaggeredParagraph
            text={titleStr}
            style={styles.title}
            staggerMs={st}
          />
          <OnboardingStaggeredParagraph
            text={descStr}
            style={styles.description}
            startDelay={titleSteps * st + 71}
            staggerMs={23}
            containerStyle={{ marginTop: 12 }}
          />
          <View style={styles.trustRow}>
            <ShieldCheck size={14} color={semantic.success} weight="fill" />
            <OnboardingStaggeredParagraph
              text={trustStr}
              style={styles.trustText}
              startDelay={trustStartDelay}
              staggerMs={20}
              containerStyle={{ flex: 1 }}
            />
          </View>
        </View>

        <Animated.View entering={preHomeMotion.ctaEnter(185)} style={styles.bottom}>
          {Platform.OS === "ios" ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={radius.lg}
              style={[styles.appleButton, isLoading && styles.disabled]}
              onPress={handleAppleSignIn}
            />
          ) : (
            <TouchableOpacity
              style={[styles.appleButtonFallback, shadow.soft, isLoading && styles.disabled]}
              onPress={handleAppleSignIn}
              disabled={isLoading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Apple ile giriş yap"
            >
              {isAppleLoading ? (
                <ActivityIndicator size="small" color={semantic.textOnDark} />
              ) : (
                <Text style={styles.appleButtonFallbackText}>
                  Apple ile Devam Et
                </Text>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.deviceButton, isLoading && styles.disabled]}
            onPress={handleDeviceSignIn}
            disabled={isLoading}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="Cihaz ile devam et"
          >
            {isDeviceLoading ? (
              <ActivityIndicator size="small" color={semantic.textPrimary} />
            ) : (
              <>
                <DeviceMobile size={18} color={semantic.textPrimary} weight="bold" />
                <Text style={styles.deviceButtonText}>Cihazımla Devam Et</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.deviceHint}>
            Hesap oluşturmadan anonim olarak kullan. Veriler yalnızca bu cihazda saklanır.
          </Text>

          <Text style={styles.legal}>
            Devam ederek Kullanım Koşullarını ve Gizlilik Politikasını kabul etmiş olursunuz.
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

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
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: spacing.xl,
  },
  top: {
    marginBottom: spacing.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: semantic.screenSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -0.8,
  },
  description: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    maxWidth: "92%",
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#E8F5EC",
    alignSelf: "flex-start",
  },
  trustText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: font.semiBold,
    color: semantic.textPrimary,
  },
  bottom: {
    gap: spacing.sm,
  },
  appleButton: {
    height: 52,
    width: "100%",
  },
  appleButtonFallback: {
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
  },
  appleButtonFallbackText: {
    color: semantic.textOnDark,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: font.semiBold,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: semantic.border,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: font.semiBold,
    color: semantic.textSecondary,
  },
  deviceButton: {
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: semantic.border,
    backgroundColor: semantic.screenSurface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  deviceButtonText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: font.semiBold,
    color: semantic.textPrimary,
  },
  deviceHint: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
  },
  legal: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  disabled: {
    opacity: 0.5,
  },
});
