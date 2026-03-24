import { TrendDown, TrendUp } from "phosphor-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTodoStore } from "@state/useTodoStore";
import { calculateMockProductivityInsights } from "@/src/utils/productivityScore";
import {
  StatsHeader,
  STATS_CARD_SHADOW,
  STATS_LAYER,
  STATS_RAISED_ITEM_SHADOW,
} from "@/src/components/StatsHeader";
import { radius, spacing } from "@/src/ui/tokens";

const TrendChip = ({ delta }: { delta: number }) => {
  if (delta > 0) {
    return (
      <View style={styles.trendChip}>
        <TrendUp size={14} color="#2F8B68" weight="bold" />
        <Text style={styles.trendText}>+{delta} haftalık ivme</Text>
      </View>
    );
  }

  if (delta < 0) {
    return (
      <View style={styles.trendChip}>
        <TrendDown size={14} color="#B5493C" weight="bold" />
        <Text style={styles.trendText}>{delta} haftalık ivme</Text>
      </View>
    );
  }

  return (
    <View style={styles.trendChip}>
      <View style={styles.trendDot} />
      <Text style={styles.trendText}>Dengeli ivme</Text>
    </View>
  );
};

export default function CompletionStatsScreen() {
  const todos = useTodoStore((state) => state.todos);
  const insights = calculateMockProductivityInsights(todos);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <StatsHeader
          title="Tamamlama Analizi"
          subtitle="Skor mantığını, puan kırılımlarını ve haftalık performansını detaylı inceleyebilirsin."
        />

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Productivity Skoru</Text>
          <Text style={styles.scoreValue}>{insights.score}</Text>
          <TrendChip delta={insights.scoreDeltaWeekly} />
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricTile}>
            <Text style={styles.metricValue}>%{insights.completionRate}</Text>
            <Text style={styles.metricLabel}>Tamamlama oranı</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricValue}>{insights.streakDays} gün</Text>
            <Text style={styles.metricLabel}>Streak</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricValue}>{insights.streakLevel}</Text>
            <Text style={styles.metricLabel}>Seviye</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricValue}>%{insights.onTimeRate}</Text>
            <Text style={styles.metricLabel}>Zamanında oran</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Puan Kırılımı</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Görev ekleme puanı</Text>
            <Text style={styles.breakdownValue}>+{insights.pointBreakdown.addedPoints}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Tamamlama puanı</Text>
            <Text style={styles.breakdownValue}>+{insights.pointBreakdown.completedPoints}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Tutarlılık bonusu</Text>
            <Text style={styles.breakdownValue}>+{insights.pointBreakdown.consistencyBonus}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownTotalLabel}>Toplam etki</Text>
            <Text style={styles.breakdownTotalValue}>{insights.pointBreakdown.total}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Kategori Performansı</Text>
          <View style={styles.chipsWrap}>
            {insights.topCategories.map((item) => (
              <View key={item.category} style={styles.chip}>
                <Text style={styles.chipText}>
                  {item.category} +{item.points}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.categoryList}>
            {insights.completedByCategory.length === 0 ? (
              <Text style={styles.emptyText}>Henüz kategori bazlı tamamlanan veri yok.</Text>
            ) : (
              insights.completedByCategory.map((item) => (
                <View key={item.category} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{item.category}</Text>
                  <Text style={styles.breakdownValue}>{item.completed} görev</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Son 7 Günlük Akış</Text>
          {insights.last7Days.map((day) => (
            <View key={day.key} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{day.label}</Text>
              <Text style={styles.breakdownValue}>
                {day.completed}/{day.total} · {day.points} puan
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.sectionCard, styles.explanationCard]}>
          <Text style={styles.sectionTitle}>Skor Neden Bu Seviyede?</Text>
          <Text style={styles.explanationText}>{insights.explanation}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: STATS_LAYER.bg,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  scoreCard: {
    borderRadius: radius.lg,
    backgroundColor: STATS_LAYER.card,
    borderWidth: 1,
    borderColor: STATS_LAYER.borderStrong,
    padding: spacing.md,
    ...STATS_CARD_SHADOW,
  },
  scoreLabel: {
    fontSize: 13,
    color: "rgba(17,17,17,0.55)",
    fontWeight: "600",
  },
  scoreValue: {
    fontSize: 44,
    lineHeight: 48,
    color: "#111111",
    fontWeight: "700",
    marginTop: spacing.xxs,
    letterSpacing: -0.8,
  },
  trendChip: {
    marginTop: spacing.xs,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: STATS_LAYER.inset,
    borderWidth: 1,
    borderColor: STATS_LAYER.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  trendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(17,17,17,0.45)",
  },
  trendText: {
    fontSize: 12,
    color: "rgba(17,17,17,0.65)",
    fontWeight: "600",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metricTile: {
    width: "48%",
    borderRadius: radius.md,
    backgroundColor: STATS_LAYER.card,
    borderWidth: 1,
    borderColor: STATS_LAYER.border,
    padding: spacing.md,
    ...STATS_RAISED_ITEM_SHADOW,
  },
  metricValue: {
    fontSize: 20,
    color: "#111111",
    fontWeight: "700",
  },
  metricLabel: {
    marginTop: 3,
    fontSize: 12,
    color: "rgba(17,17,17,0.55)",
  },
  sectionCard: {
    borderRadius: radius.lg,
    backgroundColor: STATS_LAYER.card,
    borderWidth: 1,
    borderColor: STATS_LAYER.border,
    padding: spacing.md,
    ...STATS_CARD_SHADOW,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111111",
    marginBottom: spacing.xs,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: STATS_LAYER.borderStrong,
  },
  breakdownLabel: {
    fontSize: 13,
    color: "rgba(17,17,17,0.6)",
    fontWeight: "500",
  },
  breakdownValue: {
    fontSize: 13,
    color: "#111111",
    fontWeight: "700",
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: STATS_LAYER.borderStrong,
    marginTop: spacing.xs,
  },
  breakdownTotalLabel: {
    fontSize: 14,
    color: "#111111",
    fontWeight: "700",
  },
  breakdownTotalValue: {
    fontSize: 15,
    color: "#111111",
    fontWeight: "700",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: spacing.xs,
  },
  chip: {
    borderRadius: radius.pill,
    backgroundColor: STATS_LAYER.inset,
    borderWidth: 1,
    borderColor: STATS_LAYER.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    color: "rgba(17,17,17,0.7)",
    fontWeight: "600",
  },
  categoryList: {
    marginTop: spacing.xs,
  },
  emptyText: {
    fontSize: 13,
    color: "rgba(17,17,17,0.55)",
  },
  explanationCard: {
    backgroundColor: STATS_LAYER.inset,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(17,17,17,0.65)",
  },
});
