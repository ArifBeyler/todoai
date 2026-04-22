import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import {
  InteractionManager,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Bell, BellSlash, CheckCircle } from "phosphor-react-native";
import * as Notifications from "expo-notifications";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import { useFTUEStore } from "@state/useFTUEStore";
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

// Delay before the native prompt appears. This gives the user time to read the
// screen copy and understand why we're asking.
const PROMPT_DELAY_MS = 2_000;

type PromptState = "checking" | "waiting" | "prompted" | "granted" | "denied";

export default function NotificationsScreen() {
  const { requestPermissions } = usePushNotifications();
  const setNotificationPermission = useFTUEStore((s) => s.setNotificationPermission);
  const [promptState, setPromptState] = useState<PromptState>("checking");
  const pulseScale = useSharedValue(1);
  const { triggerExit, exitStyle } = useOnboardingExit();

  const hasFiredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    let cancelled = false;

    const fireNativePrompt = async () => {
      if (hasFiredRef.current) return;
      hasFiredRef.current = true;
      setPromptState("prompted");
      const granted = await requestPermissions();
      if (cancelled) return;
      setPromptState(granted ? "granted" : "denied");
      setNotificationPermission(granted ? "granted" : "denied");
    };

    const schedulePromptIfNeeded = async () => {
      const existing = await Notifications.getPermissionsAsync();
      if (cancelled) return;

      const alreadyGranted =
        existing.granted ||
        existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
      const alreadyDenied =
        !existing.granted && existing.status === "denied";

      if (alreadyGranted) {
        setPromptState("granted");
        setNotificationPermission("granted");
        return;
      }

      if (alreadyDenied) {
        setPromptState("denied");
        setNotificationPermission("denied");
        return;
      }

      setPromptState("waiting");
      // Let the screen finish its enter animation before asking, then pause for
      // PROMPT_DELAY_MS so the user can read the benefits.
      InteractionManager.runAfterInteractions(() => {
        if (cancelled) return;
        timerRef.current = setTimeout(fireNativePrompt, PROMPT_DELAY_MS);
      });
    };

    schedulePromptIfNeeded();

    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [requestPermissions, setNotificationPermission]);

  const iconPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const goNext = () => {
    triggerExit("forward", () => router.push("/(onboarding)/microphone"));
  };

  const handleContinue = () => {
    goNext();
  };

  const handleSkip = () => {
    if (promptState === "waiting" || promptState === "checking") {
      setNotificationPermission("skipped");
    }
    goNext();
  };

  const handleBack = () => {
    triggerExit("back", () => router.back());
  };

  const titleText = "Hiçbir görevi\nkaçırma";
  const subText =
    "Hatırlatıcılar, odak uyarıları ve görsel hazır bildirimleri için izne ihtiyacımız var. Birkaç saniye sonra sistem penceresi açılır.";

  const benefitTiming = useMemo(() => {
    const t0 = 157;
    const titleSteps = countStaggerSteps(titleText);
    const subStart = t0 + titleSteps * 23 + 50;
    const subSteps = countStaggerSteps(subText);
    const listStart = subStart + subSteps * 16 + 57;
    return { t0, subStart, listStart };
  }, [titleText, subText]);

  const statusLabel = (() => {
    switch (promptState) {
      case "waiting":
        return "İzin kutusu birazdan açılacak…";
      case "prompted":
        return "Sistem izin penceresi açıldı";
      case "granted":
        return "Bildirimler açık";
      case "denied":
        return "Bildirimler kapalı. Ayarlardan açabilirsin.";
      default:
        return "";
    }
  })();

  const nextLabel = (() => {
    if (promptState === "granted") return "Harika, devam et";
    if (promptState === "denied") return "Devam et";
    if (promptState === "prompted") return "İzin isteniyor…";
    return "Devam Et";
  })();

  const nextDisabled = promptState === "prompted";

  return (
    <Animated.View
      style={[styles.container, exitStyle]}
      testID="notifications-screen"
    >
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

      {statusLabel ? (
        <View
          style={styles.statusRow}
          testID={
            promptState === "prompted"
              ? "notification-prompt-fired"
              : `notification-status-${promptState}`
          }
        >
          {promptState === "granted" ? (
            <CheckCircle size={14} color={semantic.success} weight="fill" />
          ) : null}
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      ) : null}

      <Animated.View
        entering={preHomeMotion.ctaEnter(571)}
        style={styles.buttonGroup}
      >
        <OnboardingFooter
          onNext={handleContinue}
          onBack={handleBack}
          nextLabel={nextLabel}
          nextDisabled={nextDisabled}
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    alignSelf: "center",
  },
  statusText: {
    fontSize: 13,
    fontFamily: font.medium,
    color: semantic.textSecondary,
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
