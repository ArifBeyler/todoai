import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Bank, Globe, ShieldCheck } from "phosphor-react-native";
import { font, radius, semantic, shadow, spacing } from "@/src/ui/tokens";
import {
  onboardingTyping,
  preHomeMotion,
  processingMotion,
} from "@/src/ui/motion";
import {
  SpinningLoader,
  AnimatedProgressBar,
  AnimatedChip,
  SequentialSteps,
} from "@/src/components/animations";
import { SequentialTyping } from "@/src/components/SequentialTyping";

const STEPS = [
  { label: "Avatarın oluşturuluyor…" },
  { label: "Görev planın ayarlanıyor…" },
  { label: "Görsel stilin uygulanıyor…" },
];

const CHIPS = [
  { id: "avatar", label: "Avatar" },
  { id: "plan", label: "Plan" },
  { id: "style", label: "Stil" },
] as const;

const CHIP_INTERVAL_MS = processingMotion.chipTransitionDelay;
const AUTO_ADVANCE_MS = 8_000;

const TESTIMONIALS = [
  { text: "İlk görselimde çok şaşırdım, harika olmuş!", author: "Selin M." },
  { text: "Görevlerde kendimi görmek bambaşka motivasyon.", author: "Oğuz R." },
  { text: "Her görevde yeni bir sürpriz bekliyorum.", author: "Zeynep T." },
];

type ChipState = "idle" | "loading" | "done";

export default function ProcessingScreen() {
  const [chipStates, setChipStates] = useState<ChipState[]>(["loading", "idle", "idle"]);
  const [currentStep, setCurrentStep] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const navigatedRef = useRef(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    CHIPS.forEach((_, i) => {
      const doneTimer = setTimeout(() => {
        setChipStates((prev) => {
          const next = [...prev];
          next[i] = "done";
          if (i + 1 < CHIPS.length) next[i + 1] = "loading";
          return next;
        });
        setCurrentStep(i + 1);
        setProgress((i + 1) / CHIPS.length);
      }, CHIP_INTERVAL_MS * (i + 1));
      timers.push(doneTimer);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 2_500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        router.push("/(onboarding)/insight-3");
      }
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timeout);
  }, []);

  const handleContinue = () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    router.push("/(onboarding)/insight-3");
  };

  const testimonial = TESTIMONIALS[testimonialIdx];

  const processingHeaderLines = useMemo(
    () => [
      {
        text: "Senin için hazırlanıyor…",
        pauseBeforeMs: 200,
        pauseAfterMs: 380,
        style: styles.title,
      },
      {
        text: "Yapay zekâ kişiselleştirilmiş deneyimini oluşturuyor.",
        pauseBeforeMs: 0,
        pauseAfterMs: 0,
        style: styles.sub,
      },
    ],
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          entering={preHomeMotion.sectionEnter(71)}
          style={styles.topSection}
        >
          <SpinningLoader
            size={42}
            containerSize={80}
            borderRadius={24}
            color={semantic.accent}
            backgroundColor={semantic.accentSoft}
          />

          <View style={styles.textBlock}>
            <SequentialTyping
              lines={processingHeaderLines}
              charDelayMs={onboardingTyping.charDelayMs}
              showCursor={onboardingTyping.showCursor}
              containerStyle={styles.typingBlock}
            />
          </View>

          <View style={styles.progressWrapper}>
            <AnimatedProgressBar
              progress={progress}
              fillColor={semantic.heroStart}
              height={4}
            />
          </View>
        </Animated.View>

        <Animated.View
          entering={preHomeMotion.sectionEnter(214)}
          style={styles.stepsWrapper}
        >
          <SequentialSteps steps={STEPS} currentStep={currentStep} />
        </Animated.View>

        <Animated.View
          entering={preHomeMotion.sectionEnter(357)}
          style={styles.chipRow}
        >
          <AnimatedChip
            label={CHIPS[0].label}
            icon={<Bank size={18} color={semantic.textSecondary} />}
            completedIcon={<Bank size={18} color={semantic.success} weight="fill" />}
            state={chipStates[0]}
          />
          <AnimatedChip
            label={CHIPS[1].label}
            icon={<ShieldCheck size={18} color={semantic.textSecondary} />}
            completedIcon={<ShieldCheck size={18} color={semantic.success} weight="fill" />}
            state={chipStates[1]}
          />
          <AnimatedChip
            label={CHIPS[2].label}
            icon={<Globe size={18} color={semantic.textSecondary} />}
            completedIcon={<Globe size={18} color={semantic.success} weight="fill" />}
            state={chipStates[2]}
          />
        </Animated.View>

        <Animated.View
          entering={preHomeMotion.cardEnter(500)}
          style={styles.testimonialCardOuter}
        >
          <Animated.View
            key={testimonialIdx}
            entering={FadeIn.duration(280)}
            style={styles.testimonialCard}
          >
            <Text
              style={styles.testimonialText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              &ldquo;{testimonial.text}&rdquo;
            </Text>
            <Text style={styles.testimonialAuthor}>{testimonial.author}</Text>
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View
        entering={preHomeMotion.ctaEnter(428)}
        style={styles.footer}
      >
        <TouchableOpacity
          style={[styles.button, shadow.soft]}
          onPress={handleContinue}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Devam et"
        >
          <Text style={styles.buttonText}>Devam Et</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.appBackground,
    paddingHorizontal: spacing.xl,
    paddingTop: 100,
    paddingBottom: 50,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginTop: -40,
    width: "100%",
  },
  topSection: {
    alignItems: "center",
    gap: 16,
    width: "100%",
  },
  textBlock: {
    alignItems: "center",
    gap: 6,
  },
  typingBlock: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  sub: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    textAlign: "center",
  },
  progressWrapper: {
    width: "100%",
    paddingHorizontal: spacing.md,
  },
  stepsWrapper: {
    width: "100%",
    paddingHorizontal: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  testimonialCardOuter: {
    width: "100%",
    alignSelf: "stretch",
  },
  testimonialCard: {
    backgroundColor: semantic.screenSurface,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: semantic.border,
    gap: 6,
    minHeight: 72,
    width: "100%",
  },
  testimonialText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: font.regular,
    color: semantic.textPrimary,
    textAlign: "center",
    fontStyle: "italic",
    width: "100%",
  },
  testimonialAuthor: {
    fontSize: 12,
    fontFamily: font.medium,
    color: semantic.textSecondary,
    textAlign: "center",
    width: "100%",
  },
  footer: {
    paddingTop: spacing.md,
  },
  button: {
    borderRadius: radius.lg,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    paddingVertical: 17,
  },
  buttonText: {
    color: semantic.textOnDark,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: font.bold,
  },
});
