import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Bell, BellSlash } from "phosphor-react-native";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import { font, semantic, shadow, spacing } from "@/src/ui/tokens";
import { preHomeMotion } from "@/src/ui/motion";
import { OnboardingProgress } from "@/src/components/OnboardingProgress";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import {
  OnboardingStaggeredParagraph,
  countStaggerSteps,
} from "@/src/components/OnboardingStaggeredText";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";

const BENEFITS = [
  "Görev hatırlatmaları",
  "Günlük alışkanlık bildirimleri",
  "Görsel hazır bildirim",
];

export default function NotificationsScreen() {
  const { requestPermissions } = usePushNotifications();
  const [isRequesting, setIsRequesting] = useState(false);
  const pulseScale = useSharedValue(1);
  const { triggerExit, exitStyle } = useOnboardingExit();

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const iconPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleAllow = async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      await requestPermissions();
    } finally {
      setIsRequesting(false);
      triggerExit("forward", () => router.push("/paywall?mode=soft"));
    }
  };

  const handleSkip = () => {
    triggerExit("forward", () => router.push("/paywall?mode=soft"));
  };

  const handleBack = () => {
    triggerExit("back", () => router.back());
  };

  const titleText = "Hiçbir görevi\nkaçırma";
  const subText =
    "Görev ve alışkanlık hatırlatmalarını zamanında alabilmen için bildirim iznine ihtiyacımız var.";

  const benefitTiming = useMemo(() => {
    const t0 = 157;
    const titleSteps = countStaggerSteps(titleText);
    const subStart = t0 + titleSteps * 23 + 50;
    const subSteps = countStaggerSteps(subText);
    const listStart = subStart + subSteps * 16 + 57;
    return { t0, subStart, listStart };
  }, [titleText, subText]);

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      <OnboardingProgress current={11} total={11} />

      <Animated.View
        entering={preHomeMotion.screenEnter}
        style={styles.iconArea}
      >
        <Animated.View style={[styles.iconWrap, iconPulseStyle]}>
          <Bell size={64} color={semantic.heroStart} weight="duotone" />
        </Animated.View>
      </Animated.View>

      <Animated.View entering={preHomeMotion.sectionEnter(143)}>
        <OnboardingStaggeredParagraph
          text={titleText}
          style={styles.title}
          startDelay={benefitTiming.t0}
          staggerMs={23}
        />
        <OnboardingStaggeredParagraph
          text={subText}
          style={styles.sub}
          startDelay={benefitTiming.subStart}
          staggerMs={16}
          containerStyle={styles.subSpacing}
        />
      </Animated.View>

      <View style={styles.benefitList}>
        {BENEFITS.map((text, i) => {
          const rowDelay = benefitTiming.listStart + i * 100;
          return (
            <Animated.View
              key={i}
              entering={FadeIn.delay(rowDelay).duration(243)}
              style={[styles.benefitRow, shadow.card]}
            >
              <View style={styles.benefitIconWrap}>
                <Bell size={16} color={semantic.heroStart} weight="fill" />
              </View>
              <OnboardingStaggeredParagraph
                text={text}
                style={styles.benefitText}
                startDelay={rowDelay + 36}
                staggerMs={19}
                lineGap={0}
                containerStyle={styles.benefitTextWrap}
              />
            </Animated.View>
          );
        })}
      </View>

      <Animated.View
        entering={preHomeMotion.ctaEnter(571)}
        style={styles.buttonGroup}
      >
        <OnboardingFooter
          onNext={handleAllow}
          onBack={handleBack}
          nextLabel={isRequesting ? "İzin isteniyor…" : "İzin Ver"}
          nextDisabled={isRequesting}
          showBack
        />

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Şimdilik atla"
        >
          <BellSlash size={16} color={semantic.textSecondary} />
          <Text style={styles.skipButtonText}>Şimdilik Atla</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F0",
    paddingHorizontal: spacing.xl,
    paddingTop: 90,
    paddingBottom: 52,
  },
  iconArea: {
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: semantic.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -0.8,
  },
  sub: {
    fontSize: 15,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    lineHeight: 22,
  },
  subSpacing: {
    marginTop: spacing.xs,
  },
  benefitTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  benefitList: {
    marginTop: spacing.lg,
    gap: 12,
  },
  benefitRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: semantic.border,
    backgroundColor: semantic.screenSurface,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  benefitIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: semantic.border,
    backgroundColor: semantic.appBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: font.semiBold,
    color: semantic.textPrimary,
  },
  buttonGroup: {
    marginTop: "auto",
    gap: spacing.sm,
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
  },
  skipButtonText: {
    color: semantic.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: font.semiBold,
  },
});
