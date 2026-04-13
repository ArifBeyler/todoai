import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Sparkle, Target } from "phosphor-react-native";
import type { TaskMilestoneStatus } from "@/src/hooks/useFTUE";
import { TASK_MILESTONE_THRESHOLD } from "@state/useFTUEStore";
import { radius, semantic, spacing } from "@/src/ui/tokens";

type TaskProgressBannerProps = {
  milestoneStatus: TaskMilestoneStatus;
  tasksUntilMilestone: number;
  activeTodoCount: number;
  isSubscribed: boolean;
  hasGeneratedToday?: boolean;
  onPressGenerate?: () => void;
};

export const TaskProgressBanner = ({
  milestoneStatus,
  tasksUntilMilestone,
  activeTodoCount,
  isSubscribed,
  hasGeneratedToday = false,
  onPressGenerate,
}: TaskProgressBannerProps) => {
  if (milestoneStatus === "no_tasks") return null;
  if (hasGeneratedToday) return null;

  const progress = Math.min(activeTodoCount / TASK_MILESTONE_THRESHOLD, 1);

  if (milestoneStatus === "generation_eligible") {
    return (
      <TouchableOpacity
        style={styles.eligibleBanner}
        onPress={onPressGenerate}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Günün görselini oluştur"
      >
        <View style={styles.eligibleIconWrap}>
          <Sparkle size={20} color={semantic.textOnDark} weight="fill" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eligibleTitle}>Günün görseli hazır</Text>
          <Text style={styles.eligibleSub}>
            Görevlerini tamamladıkça görsel açılacak.
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (milestoneStatus === "milestone_reached" && !isSubscribed) {
    return (
      <View style={styles.milestoneBanner}>
        <View style={styles.milestoneIconWrap}>
          <Target size={18} color={semantic.heroStart} weight="fill" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.milestoneTitle}>3 görev eklendi!</Text>
          <Text style={styles.milestoneSub}>
            Kişisel AI görselini açmak için premium'u dene.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.progressBanner}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>
          Kişisel görsel için{" "}
          <Text style={styles.progressHighlight}>
            {tasksUntilMilestone} görev daha
          </Text>
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressBanner: {
    borderRadius: radius.md,
    backgroundColor: semantic.screenSurface,
    borderWidth: 1,
    borderColor: semantic.border,
    padding: spacing.sm,
    gap: 8,
    marginBottom: spacing.sm,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 13,
    color: semantic.textSecondary,
  },
  progressHighlight: {
    fontWeight: "700",
    color: semantic.textPrimary,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EDEDEB",
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: semantic.heroStart,
  },
  milestoneBanner: {
    borderRadius: radius.md,
    backgroundColor: "#F0F4F4",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  milestoneIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: semantic.screenSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: semantic.textPrimary,
  },
  milestoneSub: {
    marginTop: 2,
    fontSize: 12,
    color: semantic.textSecondary,
    lineHeight: 16,
  },
  eligibleBanner: {
    borderRadius: radius.md,
    backgroundColor: semantic.heroStart,
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  eligibleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  eligibleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: semantic.textOnDark,
  },
  eligibleSub: {
    marginTop: 2,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 16,
  },
});
