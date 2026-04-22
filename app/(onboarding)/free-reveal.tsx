import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import {
  Bell,
  CalendarBlank,
  CheckCircle,
  Lock,
  Sparkle,
} from "phosphor-react-native";
import { useSessionStore } from "@state/useSessionStore";
import { font, radius, semantic, shadow, spacing } from "@/src/ui/tokens";
import { preHomeMotion } from "@/src/ui/motion";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";

type Feature = {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
  locked: boolean;
};

const FEATURES: Feature[] = [
  {
    icon: CheckCircle,
    title: "Görev Yönetimi",
    desc: "Görevlerini oluştur, düzenle ve tamamla.",
    locked: false,
  },
  {
    icon: Bell,
    title: "Hatırlatmalar",
    desc: "Hiçbir görevi kaçırmamak için bildirim al.",
    locked: false,
  },
  {
    icon: CalendarBlank,
    title: "Günlük Plan",
    desc: "Gününü planla, önceliklerini belirle.",
    locked: false,
  },
  {
    icon: Lock,
    title: "AI Görseller",
    desc: "Premium ile kilidi açılır.",
    locked: true,
  },
];

export default function FreeRevealScreen() {
  const completeOnboarding = useSessionStore((s) => s.completeOnboarding);
  const { triggerExit, exitStyle } = useOnboardingExit();

  const titleScale = useSharedValue(0.85);
  const titleOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withDelay(
      200,
      withSpring(1, { damping: 18, stiffness: 160 }),
    );
    titleScale.value = withDelay(
      200,
      withSequence(
        withSpring(1.06, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 140 }),
      ),
    );
  }, []);

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const handleStart = () => {
    completeOnboarding();
    triggerExit("forward", () => router.replace("/(tabs)/home"));
  };

  return (
    <Animated.View style={[styles.container, exitStyle]} testID="onboarding-free-reveal-screen">
      <Animated.View
        entering={FadeIn.delay(80).duration(400)}
        style={styles.ghostBlock}
      >
        <Text style={styles.ghostText}>Merhaba. Görevlerin seni bekliyor.</Text>
      </Animated.View>

      <Animated.View style={[styles.titleBlock, titleAnimStyle]}>
        <Text style={styles.title}>Hazırsın!</Text>
        <Animated.Text
          entering={FadeInUp.delay(320).duration(300).springify().damping(18).stiffness(150)}
          style={styles.sub}
        >
          İşte başlangıç paketiniz
        </Animated.Text>
      </Animated.View>

      <View style={styles.featureList}>
        {FEATURES.map((feature, index) => (
          <FeatureCard key={feature.title} feature={feature} index={index} />
        ))}
      </View>

      <Animated.View
        entering={preHomeMotion.ctaEnter(700)}
        style={styles.footer}
      >
        <TouchableOpacity
          style={[styles.button, shadow.soft]}
          onPress={handleStart}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Hadi Başlayalım"
        >
          <Sparkle size={18} color="#FFFFFF" weight="fill" />
          <Text style={styles.buttonText}>Hadi Başlayalım!</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

type FeatureCardProps = {
  feature: Feature;
  index: number;
};

const FeatureCard = ({ feature, index }: FeatureCardProps) => {
  const IconComponent = feature.icon;
  const delay = 400 + index * 70;

  return (
    <Animated.View
      entering={FadeInUp.delay(delay)
        .duration(300)
        .springify()
        .damping(18)
        .stiffness(160)}
      style={[
        styles.featureCard,
        shadow.card,
        feature.locked && styles.featureCardLocked,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          feature.locked ? styles.iconWrapLocked : styles.iconWrapActive,
        ]}
      >
        <IconComponent
          size={20}
          color={feature.locked ? semantic.textSecondary : semantic.success}
          weight={feature.locked ? "regular" : "fill"}
        />
      </View>

      <View style={styles.featureTextBlock}>
        <View style={styles.featureTitleRow}>
          <Text
            style={[
              styles.featureTitle,
              feature.locked && styles.featureTitleLocked,
            ]}
          >
            {feature.title}
          </Text>
          {!feature.locked && (
            <View style={styles.checkBadge}>
              <CheckCircle size={14} color={semantic.success} weight="fill" />
            </View>
          )}
        </View>
        <Text
          style={[
            styles.featureDesc,
            feature.locked && styles.featureDescLocked,
          ]}
        >
          {feature.desc}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F0",
    paddingHorizontal: spacing.xl,
    paddingTop: 74,
    paddingBottom: 50,
  },
  ghostBlock: {
    marginBottom: 28,
  },
  ghostText: {
    fontSize: 13,
    fontFamily: font.regular,
    color: semantic.textPrimary,
    opacity: 0.3,
    letterSpacing: -0.1,
  },
  titleBlock: {
    marginBottom: 28,
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    fontFamily: font.extraBold,
    color: semantic.textPrimary,
    letterSpacing: -1,
    lineHeight: 46,
  },
  sub: {
    fontSize: 16,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    marginTop: 6,
    lineHeight: 22,
  },
  featureList: {
    flex: 1,
    gap: 10,
    justifyContent: "center",
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FAFAF9",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  featureCardLocked: {
    opacity: 0.5,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderStyle: "dashed",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: "#E8F5EC",
  },
  iconWrapLocked: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  featureTextBlock: {
    flex: 1,
    gap: 3,
  },
  featureTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -0.2,
  },
  featureTitleLocked: {
    color: semantic.textSecondary,
    fontWeight: "600",
    fontFamily: font.semiBold,
  },
  checkBadge: {
    alignItems: "center",
    justifyContent: "center",
  },
  featureDesc: {
    fontSize: 13,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    lineHeight: 18,
  },
  featureDescLocked: {
    color: semantic.textSecondary,
    fontStyle: "italic",
  },
  footer: {
    paddingTop: spacing.md,
  },
  button: {
    borderRadius: radius.lg,
    backgroundColor: semantic.heroStart,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
    gap: 8,
  },
  buttonText: {
    color: semantic.textOnDark,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: font.bold,
  },
});
