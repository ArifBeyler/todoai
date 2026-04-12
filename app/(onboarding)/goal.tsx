import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  ZoomIn,
} from "react-native-reanimated";
import {
  Rocket,
  Heart,
  Book,
  Star,
  DotsThree,
  Check,
} from "phosphor-react-native";
import { useSessionStore } from "@state/useSessionStore";
import { font, spacing } from "@/src/ui/tokens";
import { preHomeMotion } from "@/src/ui/motion";
import {
  OnboardingStaggeredParagraph,
  countStaggerSteps,
} from "@/src/components/OnboardingStaggeredText";
import { useCardSelectAnimation } from "@/src/hooks/useCardSelectAnimation";
import { OnboardingProgress } from "@/src/components/OnboardingProgress";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";

const LAYER = {
  bg: "#F2F2F0",
  panel: "#FAFAF9",
  inset: "#EDEDEB",
  border: "rgba(0, 0, 0, 0.04)",
  borderStrong: "rgba(0, 0, 0, 0.08)",
  text: "#111111",
  textMuted: "rgba(17, 17, 17, 0.55)",
  textSoft: "rgba(17, 17, 17, 0.7)",
} as const;

const CARD_SHADOW = {
  shadowColor: "rgba(0, 0, 0, 0.06)",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 1,
  shadowRadius: 24,
  elevation: 6,
} as const;

const ITEM_SHADOW = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
} as const;

type GoalOption = {
  value: string;
  label: string;
  icon: React.ComponentType<any>;
};

const GOALS: GoalOption[] = [
  { value: "productivity", label: "Üretkenlik", icon: Rocket },
  { value: "health", label: "Sağlık", icon: Heart },
  { value: "learning", label: "Öğrenim", icon: Book },
  { value: "personal", label: "Kişisel Gelişim", icon: Star },
  { value: "other", label: "Diğer", icon: DotsThree },
];

export default function GoalScreen() {
  const { goals, setGoals } = useSessionStore();
  const [selected, setSelected] = useState<string[]>(goals ?? []);
  const { triggerExit, exitStyle } = useOnboardingExit();

  const handleToggle = (value: string) => {
    setSelected((prev) => {
      const next = prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value];
      setGoals(next);
      return next;
    });
  };

  const handleContinue = () => {
    if (selected.length === 0) return;
    triggerExit("forward", () => router.push("/(onboarding)/pain-points"));
  };

  const handleBack = () => {
    triggerExit("back", () => router.back());
  };

  const titleStr = "Hedeflerin neler?";
  const subStr =
    "Birden fazla seçebilirsin. Deneyimini sana göre şekillendireceğiz.";
  const titleStagger = 34;
  const titleSteps = countStaggerSteps(titleStr);

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      <View style={[styles.panel, CARD_SHADOW]}>
        <OnboardingProgress current={2} total={11} />
        <View style={styles.header}>
          <OnboardingStaggeredParagraph
            text={titleStr}
            style={styles.title}
            staggerMs={titleStagger}
          />
          <OnboardingStaggeredParagraph
            text={subStr}
            style={styles.sub}
            startDelay={titleSteps * titleStagger + 71}
            staggerMs={27}
            containerStyle={{ marginTop: 8 }}
          />
        </View>

        <Animated.View
          entering={preHomeMotion.sectionEnter(100)}
          style={styles.countPill}
        >
          <Text style={styles.countText}>
            {selected.length > 0
              ? `${selected.length} seçildi`
              : "Henüz seçim yapılmadı"}
          </Text>
        </Animated.View>

        <View style={styles.listCenter}>
          <View style={styles.list}>
            {GOALS.map((item, index) => (
                <GoalCard
                  key={item.value}
                  item={item}
                  index={index}
                  isSelected={selected.includes(item.value)}
                  onToggle={() => handleToggle(item.value)}
                />
            ))}
          </View>
        </View>
      </View>

      <Animated.View entering={preHomeMotion.ctaEnter(371)} style={styles.bottom}>
        <OnboardingFooter
          onNext={handleContinue}
          onBack={handleBack}
          nextDisabled={selected.length === 0}
          showBack
        />
      </Animated.View>
    </Animated.View>
  );
}

type GoalCardProps = {
  item: GoalOption;
  index: number;
  isSelected: boolean;
  onToggle: () => void;
};

const GoalCard = ({ item, index, isSelected, onToggle }: GoalCardProps) => {
  const IconComponent = item.icon;
  const cardAnimStyle = useCardSelectAnimation({
    isSelected,
    selectedBorderColor: LAYER.text,
    defaultBorderColor: LAYER.borderStrong,
    selectedBgColor: LAYER.inset,
    defaultBgColor: LAYER.panel,
  });

  return (
    <Animated.View entering={preHomeMotion.cardEnter(157 + index * 50)}>
      <Animated.View style={[styles.card, ITEM_SHADOW, cardAnimStyle]}>
        <TouchableOpacity
          style={styles.cardInner}
          onPress={onToggle}
          activeOpacity={0.88}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSelected }}
          accessibilityLabel={item.label}
        >
          <View
            style={[
              styles.iconWrap,
              isSelected && styles.iconWrapSelected,
            ]}
          >
            <IconComponent
              size={20}
              color={isSelected ? "#FFFFFF" : LAYER.textSoft}
              weight={isSelected ? "fill" : "regular"}
            />
          </View>
          <Text
            style={[
              styles.cardLabel,
              isSelected && styles.cardLabelSelected,
            ]}
          >
            {item.label}
          </Text>
          {isSelected && (
            <Animated.View
              entering={ZoomIn.duration(250).damping(14)}
              style={styles.checkBadge}
            >
              <Check size={12} color="#FFFFFF" weight="bold" />
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LAYER.bg,
    paddingTop: 74,
    paddingBottom: 42,
    paddingHorizontal: 14,
  },
  panel: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: LAYER.panel,
    borderWidth: 1,
    borderColor: LAYER.border,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    fontFamily: font.bold,
    color: LAYER.text,
    letterSpacing: -0.5,
  },
  sub: {
    marginTop: 6,
    fontSize: 15,
    fontFamily: font.regular,
    color: LAYER.textMuted,
    lineHeight: 21,
  },
  countPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
    marginBottom: spacing.md,
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: font.bold,
    color: LAYER.textSoft,
  },
  listCenter: {
    flex: 1,
    justifyContent: "center",
  },
  list: {
    gap: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapSelected: {
    backgroundColor: LAYER.text,
    borderColor: LAYER.text,
  },
  cardLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: font.semiBold,
    color: LAYER.text,
  },
  cardLabelSelected: {
    fontWeight: "700",
    fontFamily: font.bold,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: LAYER.text,
    alignItems: "center",
    justifyContent: "center",
  },
  bottom: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  button: {
    borderRadius: 22,
    backgroundColor: LAYER.text,
    alignItems: "center",
    paddingVertical: 17,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: font.bold,
  },
  buttonDisabled: {
    opacity: 0.35,
  },
});
