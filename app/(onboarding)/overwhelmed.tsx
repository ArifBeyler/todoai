import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { font, semantic, spacing } from "@/src/ui/tokens";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";

const T_GHOST_LINE1 = 40;   // "Merhaba. Görevlerin..." fades in fast
const T_QUESTION = 240;     // new question slides up
const T_FOOTER = 500;

// Spring config for the shared-element shrink: smooth glide, slight settle
const SHRINK_SPRING = { damping: 22, stiffness: 200, mass: 1 };

/**
 * Simulates the previous screen's large question text flying to its
 * new position as small ghost text.
 *
 * On the previous screen (distracted) the question was:
 *   fontSize 42px, centered vertically on screen
 * Here it becomes:
 *   fontSize 15px, at the top of the content block, opacity 0.3
 *
 * We animate: scale 2.7→1, translateY 55→0, opacity 0.65→0.3
 * The spring gives the same "gliding" feel as the nav capsule.
 */
function PrevQuestionGhost() {
  const scale = useSharedValue(2.7);
  const translateY = useSharedValue(55);
  const opacity = useSharedValue(0.62);

  useEffect(() => {
    scale.value = withSpring(1, SHRINK_SPRING);
    translateY.value = withSpring(0, SHRINK_SPRING);
    opacity.value = withTiming(0.3, {
      duration: 420,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={[animStyle, styles.ghostShrinkOrigin]}>
      <Text style={styles.ghostLine2}>
        Yapılacaklarını sürekli{" "}
        <Text style={styles.ghostAccent}>erteliyor</Text>
        {" "}musun?
      </Text>
    </Animated.View>
  );
}

export default function OverwhelmedScreen() {
  const { triggerExit, exitStyle } = useOnboardingExit();

  const handleContinue = () => {
    triggerExit("forward", () => router.push("/(onboarding)/solution-reveal"));
  };

  const handleBack = () => {
    triggerExit("back", () => router.back());
  };

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      <View style={styles.content}>
        <View style={styles.ghostBlock}>
          {/* Line 1 — was already small on the previous screen, just fades in */}
          <Animated.Text
            entering={FadeIn.delay(T_GHOST_LINE1).duration(240)}
            style={styles.ghostLine1}
          >
            Merhaba. Görevlerin seni bekliyor.
          </Animated.Text>

          {/* Line 2 — was the BIG question; springs down and shrinks in */}
          <PrevQuestionGhost />
        </View>

        {/* New question for this screen */}
        <Animated.View
          entering={FadeInUp.delay(T_QUESTION)
            .duration(340)
            .springify()
            .damping(18)
            .stiffness(160)}
        >
          <Text style={styles.question}>
            Önceliklerini belirlemek{" "}
            <Text style={styles.highlight}>zor</Text>
            {" "}geliyor mu?
          </Text>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeIn.delay(T_FOOTER).duration(300)}
        style={styles.footer}
      >
        <OnboardingFooter
          onNext={handleContinue}
          onBack={handleBack}
          nextLabel="Gerçekten zor."
          showBack
        />
      </Animated.View>
    </Animated.View>
  );
}

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
    paddingBottom: 60,
    gap: 28,
  },
  ghostBlock: {
    gap: 7,
  },
  // Anchor the shrink animation from the leading (left) edge so the text
  // doesn't drift horizontally during the scale transition.
  ghostShrinkOrigin: {
    alignSelf: "flex-start",
    transformOrigin: "left center",
  },
  ghostLine1: {
    fontSize: 12,
    fontFamily: font.regular,
    color: semantic.textPrimary,
    letterSpacing: -0.2,
    lineHeight: 18,
    opacity: 0.3,
  },
  ghostLine2: {
    fontSize: 15,
    fontFamily: font.semiBold,
    color: semantic.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 21,
  },
  ghostAccent: {
    color: semantic.accent,
  },
  question: {
    fontSize: 42,
    lineHeight: 52,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -1.1,
  },
  highlight: {
    color: semantic.accent,
  },
  footer: {
    marginTop: "auto",
  },
});
