import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { Check, X, Quotes } from "phosphor-react-native";
import { useSessionStore } from "@state/useSessionStore";
import { font, radius, semantic, shadow, spacing } from "@/src/ui/tokens";
import { onboardingTyping } from "@/src/ui/motion";
import { OnboardingProgress } from "@/src/components/OnboardingProgress";
import { SequentialTyping } from "@/src/components/SequentialTyping";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const CARD_WIDTH = SCREEN_WIDTH - 80;

const PAIN_STATEMENTS = [
  {
    id: "no_complete",
    text: "Listelere görev ekliyorum ama hiçbirini tamamlamıyorum.",
  },
  {
    id: "no_motivation",
    text: "Görevlerimi tamamlamak için motivasyonum yok.",
  },
  {
    id: "procrastinate",
    text: "Planladığım şeyleri sürekli erteliyorum.",
  },
  {
    id: "stress",
    text: "Yapılacaklar listem beni strese sokuyor.",
  },
  {
    id: "no_reward",
    text: "Tamamladığım görevler için bir ödül hissetmiyorum.",
  },
];

export default function TinderCardsScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [agreements, setAgreements] = useState<string[]>([]);
  const [headerIntroDone, setHeaderIntroDone] = useState(false);
  const [cardTypingComplete, setCardTypingComplete] = useState(false);
  const [doneTypingComplete, setDoneTypingComplete] = useState(false);
  const { setPainAgreements } = useSessionStore();

  const translateX = useSharedValue(0);
  const rotateZ = useSharedValue(0);

  const isFinished = currentIndex >= PAIN_STATEMENTS.length;
  const currentStatement = PAIN_STATEMENTS[currentIndex];

  useEffect(() => {
    setCardTypingComplete(false);
  }, [currentStatement?.id]);

  useEffect(() => {
    if (isFinished) {
      setDoneTypingComplete(false);
    }
  }, [isFinished]);

  const handleSwipeComplete = useCallback(
    (direction: "left" | "right") => {
      if (direction === "right") {
        setAgreements((prev) => {
          const next = [...prev, PAIN_STATEMENTS[currentIndex].id];
          setPainAgreements(next);
          return next;
        });
      }
      setCurrentIndex((prev) => prev + 1);
      translateX.value = 0;
      rotateZ.value = 0;
    },
    [currentIndex, setPainAgreements],
  );

  const { triggerExit, exitStyle } = useOnboardingExit();

  const handleContinue = () => {
    triggerExit("forward", () => router.push("/(onboarding)/personalised-solution"));
  };

  const gesture = Gesture.Pan()
    .enabled(
      !isFinished &&
        headerIntroDone &&
        cardTypingComplete,
    )
    .onUpdate((e) => {
      translateX.value = e.translationX;
      rotateZ.value = interpolate(
        e.translationX,
        [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        [-15, 0, 15],
      );
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.2, { duration: 250 }, () => {
          runOnJS(handleSwipeComplete)("right");
        });
        rotateZ.value = withTiming(20, { duration: 250 });
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.2, { duration: 250 }, () => {
          runOnJS(handleSwipeComplete)("left");
        });
        rotateZ.value = withTiming(-20, { duration: 250 });
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
        rotateZ.value = withSpring(0, { damping: 15, stiffness: 200 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotateZ.value}deg` },
    ],
  }));

  const agreeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]),
  }));

  const disagreeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0]),
  }));

  const headerTypingLines = useMemo(
    () => [
      {
        text: "Bu cümlelerle ne",
        pauseBeforeMs: 260,
        pauseAfterMs: 160,
        style: styles.title,
      },
      {
        text: "kadar ilgilisin?",
        pauseBeforeMs: 0,
        pauseAfterMs: 400,
        style: styles.title,
      },
      {
        text: "Sağa kaydır: katılıyorum · Sola kaydır: geç",
        pauseBeforeMs: 0,
        pauseAfterMs: 0,
        style: styles.sub,
      },
    ],
    [],
  );

  const doneTypingLines = useMemo(
    () => [
      {
        text: "Harika!",
        pauseBeforeMs: 200,
        pauseAfterMs: 520,
        style: styles.doneTitle,
      },
      {
        text: `${agreements.length} cümleye katıldın.`,
        pauseBeforeMs: 0,
        pauseAfterMs: 240,
        style: styles.doneDescription,
      },
      {
        text: "Şimdi sana özel çözümleri görelim.",
        pauseBeforeMs: 0,
        pauseAfterMs: 0,
        style: styles.doneDescription,
      },
    ],
    [agreements.length],
  );

  const cardTypingLines = useMemo(() => {
    if (!currentStatement) return [];
    return [
      {
        text: currentStatement.text,
        pauseBeforeMs: 0,
        pauseAfterMs: 0,
        style: styles.cardText,
      },
    ];
  }, [currentStatement]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Animated.View style={[styles.inner, exitStyle]}>
        <OnboardingProgress current={5} total={11} />

        <View style={styles.header}>
          <SequentialTyping
            lines={headerTypingLines}
            charDelayMs={onboardingTyping.charDelayMs}
            showCursor={onboardingTyping.showCursor}
            onComplete={() => setHeaderIntroDone(true)}
          />
        </View>

        <View style={styles.cardArea}>
          {isFinished ? (
            <Animated.View entering={FadeIn.duration(400)} style={styles.doneCard}>
              <View style={styles.doneIconWrap}>
                <Check size={32} color={semantic.success} weight="bold" />
              </View>
              <SequentialTyping
                key={`done-${agreements.length}`}
                lines={doneTypingLines}
                charDelayMs={onboardingTyping.charDelayMs}
                showCursor={onboardingTyping.showCursor}
                onComplete={() => setDoneTypingComplete(true)}
                containerStyle={styles.doneTypingWrap}
              />
            </Animated.View>
          ) : null}

          {!isFinished && headerIntroDone && currentStatement ? (
            <GestureDetector gesture={gesture}>
              <Animated.View
                key={currentStatement.id}
                entering={FadeIn.duration(320)}
                style={[styles.card, shadow.soft, cardStyle]}
              >
                <Animated.View style={[styles.stampLeft, disagreeOpacity]}>
                  <X size={28} color={semantic.danger} weight="bold" />
                  <Text style={styles.stampTextLeft}>GEÇ</Text>
                </Animated.View>

                <Animated.View style={[styles.stampRight, agreeOpacity]}>
                  <Check size={28} color={semantic.success} weight="bold" />
                  <Text style={styles.stampTextRight}>KATILIYORUM</Text>
                </Animated.View>

                <Quotes size={32} color="rgba(0,0,0,0.08)" weight="fill" />
                <SequentialTyping
                  lines={cardTypingLines}
                  charDelayMs={onboardingTyping.charDelayMs}
                  showCursor={onboardingTyping.showCursor}
                  onComplete={() => setCardTypingComplete(true)}
                  containerStyle={styles.cardTypingWrap}
                />
              </Animated.View>
            </GestureDetector>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.progress}>
            {PAIN_STATEMENTS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i < currentIndex && styles.progressDotDone,
                  i === currentIndex && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          {!isFinished && (
            <View
              style={[
                styles.swipeHints,
                !cardTypingComplete && styles.swipeHintsMuted,
              ]}
              pointerEvents={cardTypingComplete ? "auto" : "none"}
            >
              <TouchableOpacity
                style={styles.hintButton}
                onPress={() => {
                  translateX.value = withTiming(-SCREEN_WIDTH * 1.2, { duration: 300 }, () => {
                    runOnJS(handleSwipeComplete)("left");
                  });
                  rotateZ.value = withTiming(-20, { duration: 300 });
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Geç"
              >
                <X size={20} color={semantic.textSecondary} weight="bold" />
              </TouchableOpacity>

              <Text style={styles.counter}>
                {currentIndex + 1}/{PAIN_STATEMENTS.length}
              </Text>

              <TouchableOpacity
                style={styles.hintButton}
                onPress={() => {
                  translateX.value = withTiming(SCREEN_WIDTH * 1.2, { duration: 300 }, () => {
                    runOnJS(handleSwipeComplete)("right");
                  });
                  rotateZ.value = withTiming(20, { duration: 300 });
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Katılıyorum"
              >
                <Check size={20} color={semantic.success} weight="bold" />
              </TouchableOpacity>
            </View>
          )}

          {isFinished && doneTypingComplete ? (
            <Animated.View entering={FadeIn.duration(340)}>
              <TouchableOpacity
                style={[styles.continueButton, shadow.soft]}
                onPress={handleContinue}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Devam et"
              >
                <Text style={styles.continueText}>Devam Et</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : null}
        </View>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F0",
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 74,
    paddingBottom: 50,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -0.5,
  },
  sub: {
    marginTop: 6,
    fontSize: 15,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    lineHeight: 21,
  },
  cardTypingWrap: {
    width: "100%",
    alignItems: "center",
  },
  doneTypingWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 4,
  },
  cardArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: CARD_WIDTH,
    minHeight: 240,
    borderRadius: 28,
    backgroundColor: "#FAFAF9",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  stampRight: {
    position: "absolute",
    top: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 2.5,
    borderColor: semantic.success,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    transform: [{ rotate: "12deg" }],
  },
  stampTextRight: {
    fontSize: 14,
    fontWeight: "800",
    fontFamily: font.extraBold,
    color: semantic.success,
    letterSpacing: 0.5,
  },
  stampLeft: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 2.5,
    borderColor: semantic.danger,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    transform: [{ rotate: "-12deg" }],
  },
  stampTextLeft: {
    fontSize: 14,
    fontWeight: "800",
    fontFamily: font.extraBold,
    color: semantic.danger,
    letterSpacing: 0.5,
  },
  cardText: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "600",
    fontFamily: font.semiBold,
    color: semantic.textPrimary,
    textAlign: "center",
    letterSpacing: -0.3,
    maxWidth: "100%",
  },
  doneCard: {
    alignItems: "center",
    gap: 16,
  },
  doneIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#E8F5EC",
    alignItems: "center",
    justifyContent: "center",
  },
  doneTitle: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    textAlign: "center",
  },
  doneDescription: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    textAlign: "center",
  },
  footer: {
    gap: 20,
    paddingTop: spacing.lg,
  },
  progress: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  progressDotDone: {
    backgroundColor: semantic.success,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: semantic.heroStart,
  },
  swipeHints: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  swipeHintsMuted: {
    opacity: 0.35,
  },
  hintButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "#FAFAF9",
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textSecondary,
    minWidth: 40,
    textAlign: "center",
  },
  continueButton: {
    borderRadius: radius.lg,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    paddingVertical: 17,
  },
  continueText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: font.bold,
  },
});
