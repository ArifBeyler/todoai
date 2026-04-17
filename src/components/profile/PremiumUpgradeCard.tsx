import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Crown } from "phosphor-react-native";
import { radius, shadow, spacing } from "@/src/ui/tokens";

const PREMIUM_BENEFITS = [
  "Kişisel AI görseller",
  "Sınırsız alışkanlıklar",
  "Gelişmiş analizler",
] as const;

type PremiumUpgradeCardProps = {
  onPress: () => void;
};

export const PremiumUpgradeCard = ({ onPress }: PremiumUpgradeCardProps) => (
  <Animated.View entering={FadeInUp.delay(80).duration(320)} style={[styles.upgradeCard, shadow.card]}>
    <View style={styles.upgradeTop}>
      <View style={styles.upgradeIconWrap}>
        <Crown size={18} color="#C4962A" weight="fill" />
      </View>
      <View style={styles.upgradeTopText}>
        <Text style={styles.upgradeTitle}>Premium'a Yükselt</Text>
        <Text style={styles.upgradeSubtitle}>Tüm özelliklerin kilidini aç</Text>
      </View>
    </View>
    <View style={styles.upgradeBenefitsList}>
      {PREMIUM_BENEFITS.map((benefit) => (
        <View key={benefit} style={styles.upgradeBenefitRow}>
          <View style={styles.upgradeBenefitDot} />
          <Text style={styles.upgradeBenefitText}>{benefit}</Text>
        </View>
      ))}
    </View>
    <TouchableOpacity
      style={styles.upgradeCTA}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Premium'u keşfet"
    >
      <Text style={styles.upgradeCTAText}>Premium'u Keşfet</Text>
    </TouchableOpacity>
  </Animated.View>
);

const styles = StyleSheet.create({
  upgradeCard: {
    borderRadius: radius.xl,
    backgroundColor: "#FDFAF6",
    borderWidth: 1,
    borderColor: "#EDE5D8",
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  upgradeTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  upgradeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#FEF7E7",
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeTopText: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3A2E28",
    lineHeight: 19,
  },
  upgradeSubtitle: {
    fontSize: 12,
    color: "#9E8E84",
    fontWeight: "400",
    marginTop: 1,
  },
  upgradeBenefitsList: {
    gap: 7,
    paddingLeft: 2,
  },
  upgradeBenefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  upgradeBenefitDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C4962A",
  },
  upgradeBenefitText: {
    fontSize: 13,
    color: "#6B5B52",
    fontWeight: "500",
  },
  upgradeCTA: {
    borderRadius: radius.md,
    backgroundColor: "#3A2E28",
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 2,
  },
  upgradeCTAText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },
});
