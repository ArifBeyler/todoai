import { Redirect, router } from "expo-router";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useFTUEStore } from "@state/useFTUEStore";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";
import { font, semantic, spacing } from "@/src/ui/tokens";

// Each line and the footer appear as complete units — no character typing,
// no word-by-word stagger. Clean, immediate, premium.
const T_GREETING = 220;
const T_HEADLINE = 440;
const T_SUB = 700;
const T_FOOTER = 900;

export default function WelcomeScreen() {
  const onboardingSlidesCompleted = useFTUEStore(
    (s) => s.onboardingSlidesCompleted,
  );
  const accountGateCompleted = useFTUEStore((s) => s.accountGateCompleted);
  const { triggerExit, exitStyle } = useOnboardingExit();

  if (onboardingSlidesCompleted && accountGateCompleted) {
    return <Redirect href="/(onboarding)/photo" />;
  }

  if (onboardingSlidesCompleted) {
    return <Redirect href="/(onboarding)/name" />;
  }

  const handleContinue = () => {
    triggerExit("forward", () => router.push("/(onboarding)/distracted"));
  };

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      <View style={styles.content}>
        <Animated.Text
          entering={FadeIn.delay(T_GREETING).duration(300)}
          style={styles.greeting}
        >
          Hey.
        </Animated.Text>

        <Animated.Text
          entering={FadeInUp.delay(T_HEADLINE)
            .duration(360)
            .springify()
            .damping(18)
            .stiffness(160)}
          style={styles.headline}
        >
          Yapılacakların yine birikti, değil mi?
        </Animated.Text>

        <Animated.Text
          entering={FadeInUp.delay(T_SUB)
            .duration(320)
            .springify()
            .damping(16)
            .stiffness(140)}
          style={styles.sub}
        >
          Burada farklı.
        </Animated.Text>
      </View>

      <Animated.View
        entering={FadeIn.delay(T_FOOTER).duration(300)}
        style={styles.footer}
      >
        <OnboardingFooter
          onNext={handleContinue}
          nextLabel="Selam!"
          showBack={false}
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
    gap: 16,
  },
  greeting: {
    fontSize: 22,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  headline: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "800",
    fontFamily: font.extraBold,
    color: semantic.textPrimary,
    letterSpacing: -1.2,
  },
  sub: {
    fontSize: 18,
    fontFamily: font.medium,
    color: semantic.textSecondary,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  footer: {
    marginTop: "auto",
  },
});
