import { router } from "expo-router";
import { CaretRight, CheckCircle } from "phosphor-react-native";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

export default function CompletedStatsScreen() {
  const todos = useTodoStore((state) => state.todos);
  const completedTodos = todos
    .filter((item) => item.isCompleted && item.deletedAt == null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const insights = calculateMockProductivityInsights(todos);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <StatsHeader
          title="Tamamlananlar"
          subtitle="Tamamladığın todo listesi. Her satırdan todo detay ekranına gidebilirsin."
        />

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{completedTodos.length}</Text>
            <Text style={styles.metricLabel}>Toplam tamamlanan</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>%{insights.completionRate}</Text>
            <Text style={styles.metricLabel}>Tamamlama oranı</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Kategoriye Göre Tamamlanan</Text>
          {insights.completedByCategory.length === 0 ? (
            <Text style={styles.emptyText}>Henüz tamamlanan kategori verisi yok.</Text>
          ) : (
            insights.completedByCategory.map((item) => (
              <View key={item.category} style={styles.dayRow}>
                <Text style={styles.dayLabel}>{item.category}</Text>
                <Text style={styles.dayValue}>{item.completed} görev</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tamamlanan Görevler</Text>
          {completedTodos.length === 0 ? (
            <Text style={styles.emptyText}>Henüz tamamlanan görev yok.</Text>
          ) : (
            completedTodos.map((todo) => (
              <TouchableOpacity
                key={todo.id}
                style={styles.todoRow}
                onPress={() => router.push(`/todo/${todo.id}`)}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel={`${todo.title} detayını aç`}
              >
                <CheckCircle size={18} color="#2F8B68" weight="fill" />
                <View style={styles.todoTextWrap}>
                  <Text style={styles.todoTitle} numberOfLines={1}>
                    {todo.title}
                  </Text>
                  <Text style={styles.todoSub}>
                    {todo.recurrence === "once" ? "Görev" : "Alışkanlık"} ·{" "}
                    {new Date(todo.createdAt).toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </Text>
                </View>
                <CaretRight size={14} color="rgba(17,17,17,0.45)" />
              </TouchableOpacity>
            ))
          )}
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
  metricsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: STATS_LAYER.card,
    borderWidth: 1,
    borderColor: STATS_LAYER.border,
    padding: spacing.md,
    ...STATS_RAISED_ITEM_SHADOW,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
  },
  metricLabel: {
    marginTop: 4,
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
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: STATS_LAYER.borderStrong,
  },
  dayLabel: {
    fontSize: 13,
    color: "rgba(17,17,17,0.6)",
    fontWeight: "600",
  },
  dayValue: {
    fontSize: 13,
    color: "#111111",
    fontWeight: "600",
  },
  emptyText: {
    marginTop: spacing.xs,
    color: "rgba(17,17,17,0.55)",
    fontSize: 13,
  },
  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: STATS_LAYER.inset,
    borderWidth: 1,
    borderColor: STATS_LAYER.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  todoTextWrap: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 14,
    color: "#111111",
    fontWeight: "600",
  },
  todoSub: {
    marginTop: 2,
    fontSize: 12,
    color: "rgba(17,17,17,0.5)",
  },
});
