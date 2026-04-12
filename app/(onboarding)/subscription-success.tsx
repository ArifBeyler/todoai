import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  CheckCircle,
  Crown,
  Bell,
  Sparkle,
  UserCircle,
} from "phosphor-react-native";
import { useSessionStore } from "@state/useSessionStore";
import { useFTUEStore } from "@state/useFTUEStore";
import { font, semantic, shadow, spacing } from "@/src/ui/tokens";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import {
  OnboardingStaggeredParagraph,
  countStaggerSteps,
} from "@/src/components/OnboardingStaggeredText";

type StepStatus = "pending" | "active" | "completed";

type Step = {
  id: string;
  label: string;
  icon: typeof Crown;
};

const STEPS: Step[] = [
  { id: "profile", label: "Profilin güncelleniyor", icon: UserCircle },
  { id: "notifications", label: "Bildirim ayarların yapılıyor", icon: Bell },
  { id: "ai", label: "AI görsel üretimi aktifleştiriliyor", icon: Sparkle },
  { id: "avatar", label: "Kişisel avatarın hazırlanıyor", icon: Crown },
];

const STEP_INTERVAL_MS = 1200;
const AUTO_ADVANCE_MS = STEP_INTERVAL_MS * STEPS.length + 1500;

export default function SubscriptionSuccessScreen() {
  const profileName = useSessionStore((s) => s.profileName);
  const completeAccountGate = useFTUEStore((s) => s.completeAccountGate);
  const [completedSteps, setCompletedSteps] = useState<number>(0);
  const [canContinue, setCanContinue] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let stepIndex = 0;
    timerRef.current = setInterval(() => {
      stepIndex += 1;
      setCompletedSteps(stepIndex);
      if (stepIndex >= STEPS.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => setCanContinue(true), 600);
      }
    }, STEP_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleContinue = () => {
    completeAccountGate(true);
    router.replace("/(onboarding)/photo");
  };

  const getStepStatus = (index: number): StepStatus => {
    if (index < completedSteps) return "completed";
    if (index === completedSteps) return "active";
    return "pending";
  };

  const titleStr = profileName
    ? `Hoş geldin,\n${profileName}!`
    : "Hoş geldin!";
  const subtitleStr = "Premium hesabın aktifleştiriliyor";

  const timing = useMemo(() => {
    const titleStart = 286;
    const titleSt = 24;
    const titleSteps = countStaggerSteps(titleStr);
    const subStart = titleStart + titleSteps * titleSt + 57;
    const stepsBase = subStart + countStaggerSteps(subtitleStr) * 20 + 71;
    return { titleStart, titleSt, subStart, stepsBase };
  }, [titleStr, subtitleStr]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          entering={FadeIn.delay(143).duration(357)}
          style={styles.badgeWrap}
        >
          <View style={[styles.crownBadge, shadow.soft]}>
            <Crown size={36} color="#FFFFFF" weight="fill" />
          </View>
        </Animated.View>

        <OnboardingStaggeredParagraph
          text={titleStr}
          style={styles.title}
          startDelay={timing.titleStart}
          staggerMs={timing.titleSt}
          lineJustifyContent="center"
        />

        <OnboardingStaggeredParagraph
          text={subtitleStr}
          style={styles.subtitle}
          startDelay={timing.subStart}
          staggerMs={20}
          lineJustifyContent="center"
          containerStyle={styles.subtitleSpacing}
        />

        <View style={styles.stepsList}>
          {STEPS.map((step, index) => (
            <StepRow
              key={step.id}
              step={step}
              status={getStepStatus(index)}
              rowEnterDelay={200 + index * 86}
              labelStartDelay={timing.stepsBase + index * 93}
            />
          ))}
        </View>
      </View>

      {canContinue && (
        <Animated.View
          entering={FadeIn.duration(286)}
          style={styles.footer}
        >
          <OnboardingFooter
            onNext={handleContinue}
            nextLabel="Devam Et"
            showBack={false}
          />
        </Animated.View>
      )}
    </View>
  );
}

const StepRow = ({
  step,
  status,
  rowEnterDelay,
  labelStartDelay,
}: {
  step: Step;
  status: StepStatus;
  rowEnterDelay: number;
  labelStartDelay: number;
}) => {
  const scale = useSharedValue(status === "completed" ? 1 : 0.95);
  const spinValue = useSharedValue(0);

  useEffect(() => {
    if (status === "active") {
      spinValue.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.linear }),
        -1,
        false,
      );
    }
    if (status === "completed") {
      scale.value = withSpring(1.02, { damping: 8, stiffness: 200 });
      setTimeout(() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 150 });
      }, 200);
    }
  }, [status]);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: status === "pending" ? 0.4 : 1,
  }));

  const IconComponent = step.icon;

  return (
    <Animated.View
      entering={FadeIn.delay(rowEnterDelay).duration(400)}
      style={[styles.stepRow, rowStyle]}
    >
      <View
        style={[
          styles.stepIconWrap,
          status === "completed" && styles.stepIconCompleted,
          status === "active" && styles.stepIconActive,
        ]}
      >
        {status === "completed" ? (
          <CheckCircle size={22} color="#FFFFFF" weight="fill" />
        ) : (
          <IconComponent
            size={20}
            color={status === "active" ? semantic.accent : semantic.textSecondary}
            weight={status === "active" ? "fill" : "regular"}
          />
        )}
      </View>

      <View style={styles.stepLabelWrap}>
        <OnboardingStaggeredParagraph
          text={step.label}
          style={StyleSheet.flatten([
            styles.stepLabel,
            status === "completed" && styles.stepLabelCompleted,
            status === "active" && styles.stepLabelActive,
          ])}
          startDelay={labelStartDelay}
          staggerMs={16}
          lineGap={0}
        />
      </View>

      {status === "completed" && (
        <Animated.View entering={FadeIn.duration(300)}>
          <CheckCircle size={18} color={semantic.success} weight="fill" />
        </Animated.View>
      )}

      {status === "active" && (
        <View style={styles.loadingDots}>
          <LoadingDots />
        </View>
      )}
    </Animated.View>
  );
};

const LoadingDots = () => {
  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.3);
  const opacity3 = useSharedValue(0.3);

  useEffect(() => {
    opacity1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 300 }),
      ),
      -1,
      false,
    );
    opacity2.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 150 }),
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 300 }),
      ),
      -1,
      false,
    );
    opacity3.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 300 }),
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 150 }),
      ),
      -1,
      false,
    );
  }, []);

  const d1 = useAnimatedStyle(() => ({ opacity: opacity1.value }));
  const d2 = useAnimatedStyle(() => ({ opacity: opacity2.value }));
  const d3 = useAnimatedStyle(() => ({ opacity: opacity3.value }));

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.loadingDot, d1]} />
      <Animated.View style={[styles.loadingDot, d2]} />
      <Animated.View style={[styles.loadingDot, d3]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.appBackground,
    paddingHorizontal: spacing.xl,
    paddingTop: 100,
    paddingBottom: 52,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  badgeWrap: {
    marginBottom: 24,
  },
  crownBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: semantic.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "800",
    fontFamily: font.extraBold,
    color: semantic.textPrimary,
    letterSpacing: -1,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    textAlign: "center",
  },
  subtitleSpacing: {
    marginTop: 10,
  },
  stepsList: {
    marginTop: 40,
    width: "100%",
    gap: 12,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: semantic.screenSurface,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  stepIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepIconCompleted: {
    backgroundColor: semantic.success,
  },
  stepIconActive: {
    backgroundColor: semantic.accentSoft,
  },
  stepLabelWrap: {
    flex: 1,
    minWidth: 0,
  },
  stepLabel: {
    fontSize: 15,
    fontFamily: font.medium,
    color: semantic.textSecondary,
  },
  stepLabelCompleted: {
    color: semantic.textPrimary,
    fontFamily: font.semiBold,
  },
  stepLabelActive: {
    color: semantic.textPrimary,
    fontFamily: font.semiBold,
  },
  loadingDots: {
    width: 30,
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 4,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: semantic.accent,
  },
  footer: {
    marginTop: "auto",
  },
});
