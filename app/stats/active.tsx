import { router } from "expo-router";
import { CaretRight, CircleIcon } from "phosphor-react-native";
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

const getNearestLabel = (createdAt: string) => {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return "Yakın";

  const diffMs = Math.abs(Date.now() - parsed.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) return `${diffMinutes} dk önce`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} sa önce`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Dün";
  if (diffDays <= 7) return `${diffDays} gün önce`;
  return parsed.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
};

export default function ActiveStatsScreen() {
  const todos = useTodoStore((state) => state.todos);
  const activeTodos = todos.filter((item) => !item.isCompleted);
  const nearestTodos = [...activeTodos].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    const now = Date.now();
    return Math.abs(now - aTime) - Math.abs(now - bTime);
  });
  const insights = calculateMockProductivityInsights(todos);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <StatsHeader
          title="Aktif Görevler"
          subtitle="En yakın zamanda eklediğin aktif todo’lar burada listelenir. Her satırdan detay ekranına gidebilirsin."
        />

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{activeTodos.length}</Text>
            <Text style={styles.metricLabel}>Toplam aktif</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{insights.activeByPriority.high}</Text>
            <Text style={styles.metricLabel}>Yüksek öncelik</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Öncelik Dağılımı</Text>
          <View style={styles.priorityGrid}>
            <View style={styles.priorityTile}>
              <Text style={styles.priorityValue}>{insights.activeByPriority.low}</Text>
              <Text style={styles.priorityLabel}>Düşük</Text>
            </View>
            <View style={styles.priorityTile}>
              <Text style={styles.priorityValue}>{insights.activeByPriority.medium}</Text>
              <Text style={styles.priorityLabel}>Orta</Text>
            </View>
            <View style={styles.priorityTile}>
              <Text style={styles.priorityValue}>{insights.activeByPriority.high}</Text>
              <Text style={styles.priorityLabel}>Yüksek</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>En Yakındaki Todo’lar</Text>
          {nearestTodos.length === 0 ? (
            <Text style={styles.emptyText}>Aktif görev bulunmuyor.</Text>
          ) : (
            nearestTodos.map((todo) => (
              <TouchableOpacity
                key={todo.id}
                style={styles.todoRow}
                onPress={() => router.push(`/todo/${todo.id}`)}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel={`${todo.title} detayını aç`}
              >
                <CircleIcon size={16} color="rgba(17,17,17,0.45)" />
                <View style={styles.todoTextWrap}>
                  <Text style={styles.todoTitle} numberOfLines={1}>
                    {todo.title}
                  </Text>
                  <Text style={styles.todoSub}>
                    {todo.priority === "high" ? "Yüksek" : todo.priority === "medium" ? "Orta" : "Düşük"} öncelik ·{" "}
                    {getNearestLabel(todo.createdAt)}
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
  priorityGrid: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  priorityTile: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: STATS_LAYER.inset,
    borderWidth: 1,
    borderColor: STATS_LAYER.border,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  priorityValue: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111111",
  },
  priorityLabel: {
    marginTop: 2,
    fontSize: 12,
    color: "rgba(17,17,17,0.55)",
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
