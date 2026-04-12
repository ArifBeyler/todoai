import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { font, semantic, spacing } from "@/src/ui/tokens";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";

// Ghost block: instant FadeIn (prior context, not the focus of this screen)
// Question: slides up as a whole unit — accent word is inline, not staggered
const T_GHOST = 60;
const T_QUESTION = 220;
const T_FOOTER = 480;

export default function DistractedScreen() {
  const { triggerExit, exitStyle } = useOnboardingExit();

  const handleContinue = () => {
    triggerExit("forward", () => router.push("/(onboarding)/overwhelmed"));
  };

  const handleBack = () => {
    triggerExit("back", () => router.back());
  };

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      <View style={styles.content}>
        {/* Ghost lines — instant, low-opacity context from previous state */}
        <Animated.View
          entering={FadeIn.delay(T_GHOST).duration(260)}
          style={styles.ghostBlock}
        >
          <Text style={styles.ghostGreeting}>Merhaba.</Text>
          <Text style={styles.ghostHeadline}>Görevlerin seni bekliyor.</Text>
        </Animated.View>

        {/* Main question — arrives as a complete block */}
        <Animated.View
          entering={FadeInUp.delay(T_QUESTION)
            .duration(340)
            .springify()
            .damping(18)
            .stiffness(160)}
        >
          <Text style={styles.question}>
            Yapılacaklarını sürekli{" "}
            <Text style={styles.highlight}>erteliyor</Text>
            {" "}musun?
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
          nextLabel="Evet, maalesef."
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
    gap: 5,
    opacity: 0.32,
  },
  ghostGreeting: {
    fontSize: 14,
    fontFamily: font.regular,
    color: semantic.textPrimary,
    letterSpacing: -0.2,
  },
  ghostHeadline: {
    fontSize: 16,
    fontFamily: font.semiBold,
    color: semantic.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 22,
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
