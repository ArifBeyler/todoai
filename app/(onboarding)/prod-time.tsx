import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import {
  SunHorizon,
  Sun,
  CloudMoon,
  Moon,
  Check,
  Question,
} from "phosphor-react-native";
import { useSessionStore, type ProductiveTime } from "@state/useSessionStore";
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

type TimeOption = {
  value: ProductiveTime;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
};

const TIME_OPTIONS: TimeOption[] = [
  { value: "morning", label: "Sabah", description: "06:00 – 12:00", icon: SunHorizon },
  { value: "afternoon", label: "Öğle", description: "12:00 – 17:00", icon: Sun },
  { value: "evening", label: "Akşam", description: "17:00 – 22:00", icon: CloudMoon },
  { value: "night", label: "Gece", description: "22:00 – 06:00", icon: Moon },
];

type Selection = ProductiveTime | "unknown" | "";

export default function ProdTimeScreen() {
  const { productiveTime, setProductiveTime } = useSessionStore();
  const [selected, setSelected] = useState<Selection>(productiveTime || "");
  const { triggerExit, exitStyle } = useOnboardingExit();

  const handleSelect = (value: ProductiveTime) => {
    setSelected(value);
    setProductiveTime(value);
  };

  const handleSelectUnknown = () => {
    setSelected("unknown");
  };

  const handleContinue = () => {
    if (!selected) return;
    triggerExit("forward", () => router.push("/(onboarding)/notifications"));
  };

  const handleBack = () => {
    triggerExit("back", () => router.back());
  };

  const titleStr = "En verimli zamanın\nne zaman?";
  const subStr =
    "Hatırlatma ve görev önerilerini sana en uygun zamana ayarlayalım.";
  const ts = 34;
  const titleSteps = countStaggerSteps(titleStr);

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      <View style={[styles.panel, CARD_SHADOW]}>
        <OnboardingProgress current={10} total={11} />
        <View style={styles.header}>
          <OnboardingStaggeredParagraph
            text={titleStr}
            style={styles.title}
            staggerMs={ts}
          />
          <OnboardingStaggeredParagraph
            text={subStr}
            style={styles.sub}
            startDelay={titleSteps * ts + 71}
            staggerMs={27}
            containerStyle={{ marginTop: 8 }}
          />
        </View>

        <View style={styles.listCenter}>
          <View style={styles.list}>
            {TIME_OPTIONS.map((item, index) => (
              <TimeCard
                key={item.value}
                item={item}
                index={index}
                isSelected={selected === item.value}
                onSelect={() => handleSelect(item.value)}
              />
            ))}

            <Animated.View entering={preHomeMotion.cardEnter(157 + TIME_OPTIONS.length * 50)}>
              <Animated.View
                style={[
                  styles.card,
                  ITEM_SHADOW,
                  {
                    borderColor: selected === "unknown" ? LAYER.text : LAYER.borderStrong,
                    backgroundColor: selected === "unknown" ? LAYER.inset : LAYER.panel,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.cardInner}
                  onPress={handleSelectUnknown}
                  activeOpacity={0.88}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selected === "unknown" }}
                  accessibilityLabel="Bilmiyorum"
                >
                  <View style={[styles.iconWrap, selected === "unknown" && styles.iconWrapSelected]}>
                    <Question
                      size={20}
                      color={selected === "unknown" ? "#FFFFFF" : LAYER.textSoft}
                      weight={selected === "unknown" ? "fill" : "regular"}
                    />
                  </View>
                  <View style={styles.labelBlock}>
                    <Text style={[styles.cardLabel, selected === "unknown" && styles.cardLabelSelected]}>
                      Bilmiyorum
                    </Text>
                    <Text style={styles.cardDesc}>Sonra belirleyebilirsin</Text>
                  </View>
                  {selected === "unknown" && (
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
          </View>
        </View>
      </View>

      <Animated.View entering={preHomeMotion.ctaEnter(371)} style={styles.bottom}>
        <OnboardingFooter
          onNext={handleContinue}
          onBack={handleBack}
          nextDisabled={!selected}
          showBack
        />
      </Animated.View>
    </Animated.View>
  );
}

type TimeCardProps = {
  item: TimeOption;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
};

const TimeCard = ({ item, index, isSelected, onSelect }: TimeCardProps) => {
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
          onPress={onSelect}
          activeOpacity={0.88}
          accessibilityRole="radio"
          accessibilityState={{ selected: isSelected }}
          accessibilityLabel={item.label}
        >
          <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
            <IconComponent
              size={20}
              color={isSelected ? "#FFFFFF" : LAYER.textSoft}
              weight={isSelected ? "fill" : "regular"}
            />
          </View>
          <View style={styles.labelBlock}>
            <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
              {item.label}
            </Text>
            <Text style={styles.cardDesc}>{item.description}</Text>
          </View>
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
  labelBlock: {
    flex: 1,
    gap: 1,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: font.semiBold,
    color: LAYER.text,
  },
  cardLabelSelected: {
    fontWeight: "700",
    fontFamily: font.bold,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: font.regular,
    color: LAYER.textMuted,
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
});
