import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Crown, Sparkle, ArrowRight } from "phosphor-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFTUEStore } from "@state/useFTUEStore";
import { useSessionStore } from "@state/useSessionStore";
import { font, semantic, shadow, spacing } from "@/src/ui/tokens";

const FEATURE_BULLETS = [
  "Günlük kişisel AI görsel üretimi",
  "Görevlerin sana özel karakterlerle canlanıyor",
  "Tüm premium stillerine erişim",
];

/**
 * Premium Activation Bridge Screen
 *
 * Shown immediately after a successful premium purchase instead of silently
 * dropping back to the app. Celebrates the upgrade and leads the user into
 * the personalization (profile photo) flow.
 */
export default function PremiumBridgeScreen() {
  const insets = useSafeAreaInsets();
  const { markSubscribed } = useFTUEStore();
  const onboardingCompleted = useSessionStore((s) => s.onboardingCompleted);

  // Crown pulse animation
  const crownScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    crownScale.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withSpring(1.08, { damping: 12, stiffness: 200 }),
          withSpring(1, { damping: 12, stiffness: 200 }),
        ),
        3,
        false,
      ),
    );
    glowOpacity.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.in(Easing.ease) }),
        ),
        3,
        false,
      ),
    );
  }, [crownScale, glowOpacity]);

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: crownScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleContinue = () => {
    markSubscribed();
    if (onboardingCompleted) {
      // Existing user upgrading in-app → go to photo upload sheet on home
      router.replace("/(tabs)/home");
    } else {
      // Onboarding flow → proceed to photo upload
      router.replace("/(onboarding)/photo");
    }
  };

  const handleSkipPersonalization = () => {
    markSubscribed();
    router.replace("/(tabs)/home");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <LinearGradient
        colors={["#F5F0EA", "#FAFAF9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Crown icon */}
      <Animated.View entering={FadeIn.delay(100).duration(500)} style={styles.iconSection}>
        <View style={styles.iconWrap}>
          <Animated.View style={[styles.glowRing, glowStyle]} />
          <Animated.View style={crownStyle}>
            <Crown size={42} color="#3A2E28" weight="fill" />
          </Animated.View>
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(450).springify().damping(18)}
        style={styles.textSection}
      >
        <Text style={styles.title}>Harika, Premium aktif!</Text>
        <Text style={styles.subtitle}>
          Şimdi uygulamayı sana göre hazırlayalım.
        </Text>
      </Animated.View>

      {/* Feature list */}
      <Animated.View
        entering={FadeInDown.delay(500).duration(420).springify().damping(18)}
        style={styles.featureCard}
      >
        {FEATURE_BULLETS.map((feat, i) => (
          <Animated.View
            key={feat}
            entering={FadeInDown.delay(600 + i * 80).duration(380).springify().damping(18)}
            style={styles.featureRow}
          >
            <View style={styles.featureDot}>
              <Sparkle size={11} color="#3A2E28" weight="fill" />
            </View>
            <Text style={styles.featureText}>{feat}</Text>
          </Animated.View>
        ))}
      </Animated.View>

      {/* Personalization call-to-action */}
      <Animated.View
        entering={FadeInUp.delay(850).duration(420).springify().damping(18)}
        style={styles.actions}
      >
        <Text style={styles.ctaHint}>
          Görsellerin sana benzeyebilmesi için bir fotoğraf ekle.
        </Text>

        <TouchableOpacity
          style={[styles.primaryButton, shadow.soft]}
          onPress={handleContinue}
          activeOpacity={0.86}
          accessibilityRole="button"
          accessibilityLabel="Fotoğraf ekleyerek kişiselleştir"
        >
          <Text style={styles.primaryButtonText}>Fotoğrafımı Ekle</Text>
          <ArrowRight size={17} color="#FAFAF9" weight="bold" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSkipPersonalization}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Şimdilik atla"
        >
          <Text style={styles.skipText}>Şimdilik Atla</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  iconSection: {
    alignItems: "center",
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#EDE5D8",
    borderWidth: 1.5,
    borderColor: "rgba(58,46,40,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  glowRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    backgroundColor: "rgba(58,46,40,0.1)",
  },
  textSection: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: font.bold,
    color: "#111111",
    textAlign: "center",
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: font.regular,
    color: "rgba(17,17,17,0.58)",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 260,
  },
  featureCard: {
    width: "100%",
    backgroundColor: "#FAFAF9",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 18,
    gap: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  featureDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EDE5D8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: font.regular,
    color: "#111111",
  },
  actions: {
    width: "100%",
    gap: 12,
    alignItems: "center",
  },
  ctaHint: {
    fontSize: 13,
    fontFamily: font.regular,
    color: "rgba(17,17,17,0.50)",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 260,
  },
  primaryButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#111111",
    borderRadius: 16,
    paddingVertical: 17,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: font.bold,
    color: "#FAFAF9",
  },
  skipText: {
    fontSize: 14,
    fontFamily: font.regular,
    color: "rgba(17,17,17,0.45)",
    paddingVertical: 4,
  },
});
