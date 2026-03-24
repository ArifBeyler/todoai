import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TrendDown, TrendUp } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ProductivityInsights } from "@/src/utils/productivityScore";
import { radius, shadow, spacing } from "@/src/ui/tokens";

type ProductivityScoreSheetProps = {
  visible: boolean;
  insights: ProductivityInsights;
  onClose: () => void;
};

const TrendIcon = ({ trend }: { trend: ProductivityInsights["trend"] }) => {
  if (trend === "up") {
    return <TrendUp size={16} color="#2F8B68" weight="bold" />;
  }

  if (trend === "down") {
    return <TrendDown size={16} color="#D65B49" weight="bold" />;
  }

  return <View style={styles.trendDot} />;
};

export const ProductivityScoreSheet = ({ visible, insights, onClose }: ProductivityScoreSheetProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + spacing.md, 26) }]}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.kicker}>Productivity Pulse</Text>
          <Text style={styles.title}>Skor Detayi</Text>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Mevcut skor</Text>
            <Text style={styles.scoreValue}>{insights.score}</Text>
            <View style={styles.trendRow}>
              <TrendIcon trend={insights.trend} />
              <Text style={styles.trendText}>{insights.trendLabel}</Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>+{insights.todayPoints}</Text>
              <Text style={styles.metricLabel}>Bugunku puan</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {insights.weeklyCompleted}/{insights.weeklyTotal}
              </Text>
              <Text style={styles.metricLabel}>Haftalik tamamlama</Text>
            </View>
          </View>

          <View style={styles.rowCard}>
            <Text style={styles.rowLabel}>Zamaninda tamamlama orani</Text>
            <Text style={styles.rowValue}>%{insights.onTimeRate}</Text>
          </View>

          <View style={styles.rowCard}>
            <Text style={styles.rowLabel}>Tutarlilik serisi</Text>
            <Text style={styles.rowValue}>{insights.streakDays} gun</Text>
          </View>

          <View style={styles.categoriesCard}>
            <Text style={styles.categoriesTitle}>En guclu kategoriler</Text>
            <View style={styles.categoriesWrap}>
              {insights.topCategories.map((item) => (
                <View key={item.category} style={styles.categoryChip}>
                  <Text style={styles.categoryText}>
                    {item.category} +{item.points}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.explanationCard}>
            <Text style={styles.explanationTitle}>Skor neden bu seviyede?</Text>
            <Text style={styles.explanationText}>{insights.explanation}</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(20,16,12,0.32)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FCF8F3",
    maxHeight: "78%",
    ...shadow.soft,
  },
  handle: {
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDD2C6",
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  kicker: {
    fontSize: 12,
    color: "#8D7C70",
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
    color: "#2E2520",
    marginBottom: 4,
  },
  scoreCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E5DBD0",
    backgroundColor: "#FFFDF9",
    padding: spacing.md,
  },
  scoreLabel: {
    fontSize: 13,
    color: "#7E6F64",
    marginBottom: 6,
  },
  scoreValue: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "700",
    color: "#2E2520",
    letterSpacing: -0.8,
  },
  trendRow: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#F4EFE8",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trendText: {
    fontSize: 12,
    color: "#5A4E46",
    fontWeight: "600",
  },
  trendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#8A7B70",
  },
  metricsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: "#F5EFE7",
    padding: spacing.md,
  },
  metricValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    color: "#332923",
  },
  metricLabel: {
    marginTop: 3,
    fontSize: 12,
    color: "#7E6F64",
  },
  rowCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E8DED2",
    backgroundColor: "#FFFDF9",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    fontSize: 14,
    color: "#61544C",
    fontWeight: "500",
  },
  rowValue: {
    fontSize: 14,
    color: "#2E2520",
    fontWeight: "700",
  },
  categoriesCard: {
    borderRadius: radius.md,
    backgroundColor: "#F5EFE7",
    padding: spacing.md,
  },
  categoriesTitle: {
    fontSize: 13,
    color: "#6D5E54",
    fontWeight: "600",
    marginBottom: 10,
  },
  categoriesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DDCFC1",
    backgroundColor: "#FFFDF9",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryText: {
    fontSize: 12,
    color: "#4D4039",
    fontWeight: "600",
  },
  explanationCard: {
    borderRadius: radius.md,
    backgroundColor: "#F0E8DD",
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  explanationTitle: {
    fontSize: 13,
    color: "#5B4E46",
    fontWeight: "700",
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#5F5249",
  },
});
