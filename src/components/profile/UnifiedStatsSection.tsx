import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { radius, shadow, spacing } from "@/src/ui/tokens";

type UnifiedStatsSectionProps = {
  points: number;
  completed: number;
  streak: number;
  focusMinutes: number;
};

export const UnifiedStatsSection = ({
  points,
  completed,
  streak,
  focusMinutes,
}: UnifiedStatsSectionProps) => {
  const stats = [
    { value: String(points), label: "Puan" },
    { value: String(completed), label: "Tamamlanan" },
    { value: String(streak), label: "Seri" },
    { value: `${focusMinutes}dk`, label: "Bugün Odak" },
  ];

  return (
    <Animated.View
      entering={FadeInUp.delay(120).duration(340)}
      style={[styles.statsContainer, shadow.card]}
    >
      {stats.flatMap((stat, index) => {
        const col = (
          <View key={stat.label} style={styles.statColumn}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        );
        if (index < stats.length - 1) {
          return [col, <View key={`div-${index}`} style={styles.statDivider} />];
        }
        return [col];
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    borderRadius: radius.xl,
    backgroundColor: "#FDFAF6",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  statColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#3A2E28",
    lineHeight: 26,
  },
  statLabel: {
    fontSize: 10,
    color: "#9E8E84",
    fontWeight: "500",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: "#EDE5D8",
  },
});
