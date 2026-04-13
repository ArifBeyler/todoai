import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { ImageSquare, Star, Sparkle } from "phosphor-react-native";
import { radius, semantic, spacing } from "@/src/ui/tokens";

type GalleryMilestoneProps = {
  count: number;
};

const MILESTONES = [
  { threshold: 10, icon: Star, label: "İlk 10 görsel!", color: "#C4962A" },
  { threshold: 25, icon: Sparkle, label: "25 görsel koleksiyonu!", color: semantic.accent },
  { threshold: 50, icon: ImageSquare, label: "50 görsel — harika koleksiyon!", color: "#5C7CAA" },
  { threshold: 100, icon: Star, label: "100 görsel — efsanevi!", color: "#C4962A" },
];

export const GalleryMilestone = ({ count }: GalleryMilestoneProps) => {
  const milestone = [...MILESTONES]
    .reverse()
    .find((m) => count >= m.threshold);

  if (!milestone) return null;

  const Icon = milestone.icon;

  return (
    <Animated.View entering={FadeInUp.delay(200).duration(500).springify()} style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: `${milestone.color}15` }]}>
        <Icon size={22} color={milestone.color} weight="fill" />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{milestone.label}</Text>
        <Text style={styles.count}>{count} görsel koleksiyonunda</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.xl,
    backgroundColor: "#FFFBF0",
    borderWidth: 1,
    borderColor: "#F0E8D0",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3A2E28",
  },
  count: {
    fontSize: 12,
    color: "#8A7A70",
    fontWeight: "500",
  },
});
