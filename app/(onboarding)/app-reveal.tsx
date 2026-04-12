import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { CheckCircle, Brain, Sparkle } from "phosphor-react-native";
import { useFTUEStore } from "@state/useFTUEStore";
import { font, radius, semantic, shadow, spacing } from "@/src/ui/tokens";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";

type Feature = {
  icon: React.ComponentType<any>;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: Sparkle,
    iconColor: semantic.accent,
    iconBg: semantic.accentSoft,
    title: "Kişiselleştirilmiş deneyim",
    description: "Hedeflerin ve alışkanlıklarına göre şekillenir.",
  },
  {
    icon: Brain,
    iconColor: "#7C3AED",
    iconBg: "#F3EFFE",
    title: "AI destekli görev yönetimi",
    description: "Akıllı önceliklendirme ile odağını koruyan öneriler.",
  },
  {
    icon: CheckCircle,
    iconColor: semantic.success,
    iconBg: "#ECFDF5",
    title: "Her gün daha verimli",
    description: "Küçük adımlarla büyük hedeflere ulaşmana yardım eder.",
  },
];

// Timings — everything lands within ~640ms
const T_GHOST = 0;       // ghost flies in immediately
const T_TITLE = 180;     // headline appears
const T_CARD_0 = 300;    // first card
const T_CARD_GAP = 80;   // between cards
const T_FOOTER = 560;    // footer after last card settles

const CARD_SPRING = { damping: 16, stiffness: 160 };

function FeatureCard({ feature }: { feature: Feature }) {
  const IconComponent = feature.icon;
  return (
    <View style={[styles.featureRow, shadow.card]}>
      <View style={[styles.iconWrap, { backgroundColor: feature.iconBg }]}>
        <IconComponent size={22} color={feature.iconColor} weight="fill" />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDesc}>{feature.description}</Text>
      </View>
    </View>
  );
}

/**
 * Ghost block animates as if it arrived from the previous screen:
 * starts larger + higher, quickly springs down and shrinks to its
 * resting size. Opacity settles at 0.3 (the muted "ghost" state).
 */
function AnimatedGhostBlock() {
  const scale = useSharedValue(1.18);
  const translateY = useSharedValue(-28);
  const opacity = useSharedValue(0.75);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 18, stiffness: 170, mass: 1 });
    translateY.value = withSpring(0, { damping: 18, stiffness: 170, mass: 1 });
    opacity.value = withTiming(0.3, {
      duration: 380,
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
    <Animated.View style={[styles.ghostBlock, animStyle]}>
      <Text style={styles.ghostLine1}>Bir çözüm var:</Text>
      <Text style={styles.ghostLine2}>
        <Text style={styles.ghostBrand}>Doara</Text>
        {" — Görevlerin, senin hikâyen."}
      </Text>
    </Animated.View>
  );
}

export default function AppRevealScreen() {
  const completeSlidesOnboarding = useFTUEStore(
    (s) => s.completeSlidesOnboarding,
  );
  const { triggerExit, exitStyle } = useOnboardingExit();

  const handleContinue = () => {
    completeSlidesOnboarding();
    triggerExit("forward", () => router.push("/(onboarding)/name"));
  };

  const handleBack = () => {
    triggerExit("back", () => router.back());
  };

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      <View style={styles.content}>
        {/* Ghost: simulates text flying in from the previous screen */}
        <AnimatedGhostBlock />

        {/* Headline */}
        <Animated.Text
          entering={FadeInUp.delay(T_TITLE)
            .duration(300)
            .springify()
            .damping(18)
            .stiffness(160)}
          style={styles.title}
        >
          İşte bu yüzden yarattık:
        </Animated.Text>

        {/* Feature cards — staggered */}
        <View style={styles.featureList}>
          {FEATURES.map((feature, i) => (
            <Animated.View
              key={feature.title}
              entering={FadeInUp.delay(T_CARD_0 + i * T_CARD_GAP)
                .duration(280)
                .springify()
                .damping(CARD_SPRING.damping)
                .stiffness(CARD_SPRING.stiffness)}
            >
              <FeatureCard feature={feature} />
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <Animated.View
        entering={FadeIn.delay(T_FOOTER).duration(260)}
        style={styles.footer}
      >
        <OnboardingFooter
          onNext={handleContinue}
          onBack={handleBack}
          nextLabel="Hadi başlayalım!"
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
    paddingBottom: 48,
    gap: 24,
  },
  ghostBlock: {
    gap: 5,
    alignSelf: "flex-start",
  },
  ghostLine1: {
    fontSize: 12,
    fontFamily: font.regular,
    color: semantic.textPrimary,
    letterSpacing: -0.2,
  },
  ghostLine2: {
    fontSize: 14,
    fontFamily: font.semiBold,
    color: semantic.textPrimary,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  ghostBrand: {
    color: semantic.accent,
  },
  title: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -0.6,
  },
  featureList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: semantic.screenSurface,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: font.semiBold,
    color: semantic.textPrimary,
    letterSpacing: -0.3,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: font.regular,
    color: semantic.textSecondary,
  },
  footer: {
    marginTop: "auto",
  },
});
