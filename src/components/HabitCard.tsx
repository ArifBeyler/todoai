import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Fire, TrendUp } from "phosphor-react-native";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

type HabitCardProps = {
  title: string;
  currentCount: number;
  goalCount: number;
  streak: number;
  onPress: () => void;
  onIncrement: () => void;
};

export const HabitCard = ({
  title,
  currentCount,
  goalCount,
  streak,
  onPress,
  onIncrement,
}: HabitCardProps) => {
  const progress = goalCount > 0 ? Math.min(currentCount / goalCount, 1) : 0;
  const isDone = currentCount >= goalCount;

  return (
    <TouchableOpacity
      style={[styles.card, shadow.card]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
    >
      <View style={styles.topRow}>
        <Text style={[styles.title, isDone && styles.titleDone]} numberOfLines={1}>
          {title}
        </Text>
        {streak > 0 ? (
          <View style={styles.streakBadge}>
            <Fire size={12} color="#C28B58" weight="fill" />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentCount}/{goalCount}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.trendBadge}>
          <TrendUp size={12} color="#76A28A" weight="bold" />
          <Text style={styles.trendText}>Günlük</Text>
        </View>
        <TouchableOpacity
          style={[styles.incrementButton, isDone && styles.incrementDone]}
          onPress={onIncrement}
          disabled={isDone}
          activeOpacity={0.85}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Artır"
        >
          <Text style={[styles.incrementText, isDone && styles.incrementTextDone]}>
            {isDone ? "✓" : "+1"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: semantic.cardSurface,
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#332821",
  },
  titleDone: {
    color: "#8C7E74",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F7EEE5",
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  streakText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C28B58",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EDE5D8",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#76A28A",
  },
  progressText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5C4E46",
    minWidth: 32,
    textAlign: "right",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECF5F1",
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#76A28A",
  },
  incrementButton: {
    borderRadius: radius.pill,
    backgroundColor: "#202126",
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  incrementDone: {
    backgroundColor: "#ECF5F1",
  },
  incrementText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FDFAF6",
  },
  incrementTextDone: {
    color: "#76A28A",
  },
});
