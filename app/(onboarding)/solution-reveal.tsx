import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { font, semantic, spacing } from "@/src/ui/tokens";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";

// ─── Font cycling for brand name ──────────────────────────────────────────────

const CYCLING_FONTS = [
  "Inter-Black",
  "Inter-ThinItalic",
  "Inter-ExtraBold",
  "Inter-Light",
  "Inter-BlackItalic",
  "Inter-Regular",
  "PlayfairDisplay_900Black",
  "PlayfairDisplay_400Regular_Italic",
  "PlayfairDisplay_700Bold",
  "PlayfairDisplay_400Regular",
  "PlayfairDisplay_700Bold_Italic",
  "BebasNeue_400Regular",
  "Pacifico_400Regular",
  "SpaceMono_700Bold",
  "SpaceMono_400Regular_Italic",
  "SpaceMono_400Regular",
  "Oswald_700Bold",
  "Oswald_300Light",
  "Oswald_600SemiBold",
] as const;

// ─── Timings ─────────────────────────────────────────────────────────────────

const T_GHOST = 0;        // both ghost lines animate at mount
const T_PRETITLE = 200;   // "Bir çözüm var:"
const T_BRAND = 360;      // "Doara" + font cycling starts
const T_TAGLINE = 600;    // "Görevlerin, senin hikâyen."
const T_FOOTER = 820;

const SHRINK_SPRING = { damping: 22, stiffness: 200, mass: 1 };

// ─── Ghost: older question (distracted screen) ───────────────────────────────
// Was already small ghost on previous screen — quick FadeIn only.

function OlderQuestionGhost() {
  return (
    <Animated.View entering={FadeIn.delay(T_GHOST + 40).duration(260)}>
      <Text style={[styles.ghostLine, styles.ghostOpacity]}>
        Yapılacaklarını sürekli{" "}
        <Text style={styles.ghostAccent}>erteliyor</Text>
        {" "}musun?
      </Text>
    </Animated.View>
  );
}

// ─── Ghost: newest question (overwhelmed screen) ──────────────────────────────
// Was the large question on the previous screen — shrinks and glides to position.

function NewerQuestionGhost() {
  const scale = useSharedValue(2.5);
  const translateY = useSharedValue(48);
  const opacity = useSharedValue(0.58);

  useEffect(() => {
    scale.value = withSpring(1, SHRINK_SPRING);
    translateY.value = withSpring(0, SHRINK_SPRING);
    opacity.value = withTiming(0.3, {
      duration: 400,
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
      <Text style={styles.ghostLine}>
        Önceliklerini belirlemek{" "}
        <Text style={styles.ghostAccent}>zor</Text>
        {" "}geliyor mu?
      </Text>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SolutionRevealScreen() {
  const { triggerExit, exitStyle } = useOnboardingExit();
  const brandScale = useSharedValue(0.82);
  const brandOpacity = useSharedValue(0);
  const fontScalePulse = useSharedValue(1);

  const [fontIndex, setFontIndex] = useState(0);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    brandOpacity.value = withDelay(
      T_BRAND,
      withTiming(1, { duration: 380, easing: Easing.out(Easing.ease) }),
    );
    brandScale.value = withDelay(
      T_BRAND,
      withSpring(1, { damping: 12, stiffness: 140 }),
    );

    const startTimeout = setTimeout(() => {
      cycleRef.current = setInterval(() => {
        fontScalePulse.value = withSequence(
          withTiming(0.92, { duration: 75, easing: Easing.out(Easing.ease) }),
          withSpring(1, { damping: 8, stiffness: 200 }),
        );
        setFontIndex((prev) => (prev + 1) % CYCLING_FONTS.length);
      }, 620);
    }, T_BRAND + 700);

    return () => {
      clearTimeout(startTimeout);
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, []);

  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ scale: brandScale.value * fontScalePulse.value }],
  }));

  const handleContinue = () => {
    if (cycleRef.current) clearInterval(cycleRef.current);
    triggerExit("forward", () => router.push("/(onboarding)/app-reveal"));
  };

  const handleBack = () => {
    if (cycleRef.current) clearInterval(cycleRef.current);
    triggerExit("back", () => router.back());
  };

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      <View style={styles.content}>
        {/* Ghost block — previous questions accumulate here */}
        <View style={styles.ghostBlock}>
          <OlderQuestionGhost />
          <NewerQuestionGhost />
        </View>

        {/* "Bir çözüm var:" */}
        <Animated.Text
          entering={FadeInUp.delay(T_PRETITLE)
            .duration(300)
            .springify()
            .damping(18)
            .stiffness(160)}
          style={styles.preTitle}
        >
          Bir çözüm var:
        </Animated.Text>

        {/* "Doara" with font cycling */}
        <View style={styles.brandContainer}>
          <Animated.Text
            style={[
              styles.brandName,
              brandStyle,
              { fontFamily: CYCLING_FONTS[fontIndex] },
            ]}
          >
            Doara
          </Animated.Text>
        </View>

        {/* Tagline */}
        <Animated.Text
          entering={FadeInUp.delay(T_TAGLINE)
            .duration(320)
            .springify()
            .damping(18)
            .stiffness(150)}
          style={styles.tagline}
        >
          Görevlerin, senin hikâyen.
        </Animated.Text>
      </View>

      <Animated.View
        entering={FadeIn.delay(T_FOOTER).duration(280)}
        style={styles.footer}
      >
        <OnboardingFooter
          onNext={handleContinue}
          onBack={handleBack}
          nextLabel="Nasıl çalışıyor?"
          showBack
        />
      </Animated.View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    gap: 22,
  },
  ghostBlock: {
    gap: 8,
  },
  // Scale originates from the left edge so text doesn't shift horizontally
  ghostShrinkOrigin: {
    alignSelf: "flex-start",
    transformOrigin: "left center",
  },
  ghostOpacity: {
    opacity: 0.3,
  },
  ghostLine: {
    fontSize: 14,
    fontFamily: font.semiBold,
    color: semantic.textPrimary,
    letterSpacing: -0.25,
    lineHeight: 20,
  },
  ghostAccent: {
    color: semantic.accent,
  },
  preTitle: {
    fontSize: 22,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    letterSpacing: -0.3,
  },
  brandContainer: {
    alignSelf: "flex-start",
  },
  brandName: {
    fontSize: 72,
    lineHeight: 80,
    fontWeight: "900",
    fontFamily: font.black,
    color: semantic.textPrimary,
    letterSpacing: -2.5,
  },
  tagline: {
    fontSize: 18,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    letterSpacing: -0.3,
  },
  footer: {
    marginTop: "auto",
  },
});
