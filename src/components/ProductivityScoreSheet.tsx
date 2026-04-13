import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TrendDown, TrendUp, Trophy, Lightning, CheckCircle, Flame } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ProductivityInsights } from "@/src/utils/productivityScore";
import { font, radius, semantic, shadow, spacing } from "@/src/ui/tokens";

type ProductivityScoreSheetProps = {
  visible: boolean;
  insights: ProductivityInsights;
  onClose: () => void;
};

const TrendBadge = ({ trend }: { trend: ProductivityInsights["trend"] }) => {
  const isUp = trend === "up";
  const isDown = trend === "down";

  return (
    <View
      style={[
        styles.trendBadge,
        isUp && styles.trendBadgeUp,
        isDown && styles.trendBadgeDown,
      ]}
    >
      {isUp && <TrendUp size={13} color={semantic.success} weight="bold" />}
      {isDown && <TrendDown size={13} color={semantic.danger} weight="bold" />}
      {!isUp && !isDown && <View style={styles.trendDot} />}
      <Text
        style={[
          styles.trendText,
          isUp && styles.trendTextUp,
          isDown && styles.trendTextDown,
        ]}
      >
        {/* trendLabel prop exposed by insights */}
      </Text>
    </View>
  );
};

export const ProductivityScoreSheet = ({
  visible,
  insights,
  onClose,
}: ProductivityScoreSheetProps) => {
  const insets = useSafeAreaInsets();

  const isUp = insights.trend === "up";
  const isDown = insights.trend === "down";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom + spacing.md, 26) },
        ]}
      >
        <View style={styles.handle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Header */}
          <Text style={styles.kicker}>Verimlilik Raporu</Text>
          <Text style={styles.title}>Skor Detayı</Text>

          {/* Main score card */}
          <View style={[styles.scoreCard, shadow.card]}>
            <Text style={styles.scoreLabel}>Mevcut skor</Text>
            <Text style={styles.scoreValue}>{insights.score}</Text>

            <View
              style={[
                styles.trendBadge,
                isUp && styles.trendBadgeUp,
                isDown && styles.trendBadgeDown,
              ]}
            >
              {isUp && <TrendUp size={13} color={semantic.success} weight="bold" />}
              {isDown && <TrendDown size={13} color={semantic.danger} weight="bold" />}
              {!isUp && !isDown && <View style={styles.trendDot} />}
              <Text
                style={[
                  styles.trendText,
                  isUp && styles.trendTextUp,
                  isDown && styles.trendTextDown,
                ]}
              >
                {insights.trendLabel}
              </Text>
            </View>
          </View>

          {/* Metric pair */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, shadow.card]}>
              <View style={styles.metricIconWrap}>
                <Lightning size={14} color={semantic.accent} weight="fill" />
              </View>
              <Text style={styles.metricValue}>+{insights.todayPoints}</Text>
              <Text style={styles.metricLabel}>Bugünkü puan</Text>
            </View>
            <View style={[styles.metricCard, shadow.card]}>
              <View style={styles.metricIconWrap}>
                <CheckCircle size={14} color={semantic.success} weight="fill" />
              </View>
              <Text style={styles.metricValue}>
                {insights.weeklyCompleted}/{insights.weeklyTotal}
              </Text>
              <Text style={styles.metricLabel}>Haftalık tamamlama</Text>
            </View>
          </View>

          {/* Row stats */}
          <View style={[styles.rowsCard, shadow.card]}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Zamanında tamamlama oranı</Text>
              <Text style={styles.statValue}>%{insights.onTimeRate}</Text>
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Tutarlılık serisi</Text>
              <View style={styles.streakWrap}>
                <Flame size={13} color={semantic.accent} weight="fill" />
                <Text style={styles.statValue}>{insights.streakDays} gün</Text>
              </View>
            </View>
          </View>

          {/* Top categories */}
          <View style={[styles.categoriesCard, shadow.card]}>
            <View style={styles.categoriesHeader}>
              <Trophy size={14} color={semantic.textSecondary} weight="bold" />
              <Text style={styles.categoriesTitle}>En güçlü kategoriler</Text>
            </View>
            {insights.topCategories.length > 0 ? (
              <View style={styles.chipsWrap}>
                {insights.topCategories.map((item) => (
                  <View key={item.category} style={styles.categoryChip}>
                    <Text style={styles.categoryText}>
                      {item.category}
                    </Text>
                    <Text style={styles.categoryPoints}>+{item.points}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyCategories}>
                Henüz kategori verisi yok.
              </Text>
            )}
          </View>

          {/* Explanation */}
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
    backgroundColor: "rgba(17,17,17,0.28)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: semantic.appBackground,
    maxHeight: "80%",
    ...shadow.soft,
  },
  handle: {
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: semantic.border,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },

  // Header
  kicker: {
    fontSize: 11,
    fontFamily: font.semiBold,
    fontWeight: "600",
    color: semantic.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
    fontFamily: font.extraBold,
    color: semantic.textPrimary,
    letterSpacing: -0.6,
    marginBottom: spacing.xs,
  },

  // Score card
  scoreCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: semantic.border,
    backgroundColor: semantic.screenSurface,
    padding: spacing.md,
  },
  scoreLabel: {
    fontSize: 13,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    fontSize: 52,
    lineHeight: 56,
    fontWeight: "800",
    fontFamily: font.extraBold,
    color: semantic.textPrimary,
    letterSpacing: -1.5,
  },

  // Trend badge
  trendBadge: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: semantic.appBackground,
    borderWidth: 1,
    borderColor: semantic.border,
  },
  trendBadgeUp: {
    backgroundColor: "#EAF5EE",
    borderColor: "rgba(63,154,116,0.2)",
  },
  trendBadgeDown: {
    backgroundColor: "#FBF0EE",
    borderColor: "rgba(226,81,62,0.2)",
  },
  trendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: semantic.textSecondary,
  },
  trendText: {
    fontSize: 12,
    fontFamily: font.semiBold,
    fontWeight: "600",
    color: semantic.textSecondary,
  },
  trendTextUp: {
    color: semantic.success,
  },
  trendTextDown: {
    color: semantic.danger,
  },

  // Metric cards
  metricsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semantic.border,
    backgroundColor: semantic.screenSurface,
    padding: spacing.md,
    gap: 4,
  },
  metricIconWrap: {
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -0.4,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    lineHeight: 16,
  },

  // Row stats
  rowsCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: semantic.border,
    backgroundColor: semantic.screenSurface,
    paddingHorizontal: spacing.md,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 54,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: semantic.border,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: font.regular,
    color: semantic.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontFamily: font.bold,
    fontWeight: "700",
    color: semantic.textPrimary,
  },
  streakWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  // Categories
  categoriesCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: semantic.border,
    backgroundColor: semantic.screenSurface,
    padding: spacing.md,
  },
  categoriesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.sm,
  },
  categoriesTitle: {
    fontSize: 13,
    fontFamily: font.semiBold,
    fontWeight: "600",
    color: semantic.textSecondary,
    letterSpacing: 0.2,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: semantic.border,
    backgroundColor: semantic.appBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: font.semiBold,
    fontWeight: "600",
    color: semantic.textPrimary,
  },
  categoryPoints: {
    fontSize: 12,
    fontFamily: font.regular,
    color: semantic.accent,
    fontWeight: "600",
  },
  emptyCategories: {
    fontSize: 13,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    fontStyle: "italic",
  },

  // Explanation
  explanationCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: semantic.border,
    backgroundColor: semantic.appBackground,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  explanationTitle: {
    fontSize: 13,
    fontFamily: font.bold,
    fontWeight: "700",
    color: semantic.textPrimary,
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: font.regular,
    color: semantic.textSecondary,
  },
});
