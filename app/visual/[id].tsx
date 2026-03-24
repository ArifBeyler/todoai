import { router, useLocalSearchParams } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMemo } from "react";
import { X } from "phosphor-react-native";
import { useTodoStore } from "@state/useTodoStore";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

export default function VisualDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { visuals, todos } = useTodoStore();
  const visual = useMemo(() => visuals.find((item) => item.id === params.id), [params.id, visuals]);

  if (!visual) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Görsel bulunamadı.</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backLink}>Geri dön</Text></TouchableOpacity>
      </View>
    );
  }

  const linkedTodos = todos.filter((todo) => visual.todoIds.includes(todo.id));

  return (
    <View style={styles.container}>
      <Image source={{ uri: visual.imageUrl }} style={styles.image} resizeMode="cover" />
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <X size={18} color={semantic.textPrimary} weight="bold" />
      </TouchableOpacity>

      <ScrollView style={styles.sheet} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.handle} />
        <Text style={styles.title}>Görsel Detayı</Text>
        <Text style={styles.subtitle}>{new Date(visual.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</Text>

        <Text style={styles.sectionTitle}>Bu görsele dahil görevler</Text>
        <View style={styles.list}>
          {linkedTodos.length === 0 ? (
            <Text style={styles.emptyText}>Bu görselde kayıtlı görev bulunmuyor.</Text>
          ) : (
            linkedTodos.map((todo) => (
              <View key={todo.id} style={[styles.todoRow, shadow.card]}>
                <Text style={styles.todoBullet}>•</Text>
                <Text style={styles.todoText}>{todo.title}</Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.closeSheetButton} onPress={() => router.back()}>
          <Text style={styles.closeSheetButtonText}>Kapat</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: semantic.textPrimary },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: semantic.appBackground, gap: spacing.sm },
  notFoundText: { fontSize: 16, color: semantic.textSecondary },
  backLink: { fontSize: 15, color: semantic.heroStart, fontWeight: "700" },
  image: { width: "100%", height: "53%" },
  closeButton: { position: "absolute", top: 56, right: 18, width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,250,243,0.95)" },
  sheet: { flex: 1, marginTop: -28, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: semantic.appBackground, paddingHorizontal: spacing.xl },
  handle: { alignSelf: "center", width: 42, height: 5, borderRadius: radius.pill, backgroundColor: semantic.border, marginTop: spacing.sm, marginBottom: spacing.md },
  title: { fontSize: 31, lineHeight: 34, fontWeight: "700", color: semantic.textPrimary },
  subtitle: { marginTop: spacing.xs, fontSize: 14, color: semantic.textSecondary, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, color: semantic.textPrimary, fontWeight: "700", marginBottom: spacing.sm },
  list: { gap: spacing.sm, marginBottom: spacing.lg },
  todoRow: { borderRadius: radius.md, backgroundColor: semantic.screenSurface, paddingVertical: 12, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  todoBullet: { fontSize: 20, color: semantic.heroStart },
  todoText: { fontSize: 15, color: semantic.textPrimary, fontWeight: "500", flex: 1 },
  emptyText: { fontSize: 14, color: semantic.textSecondary },
  closeSheetButton: { borderRadius: radius.lg, alignItems: "center", justifyContent: "center", backgroundColor: semantic.heroStart, paddingVertical: 16 },
  closeSheetButtonText: { color: semantic.textOnDark, fontWeight: "700", fontSize: 16 },
});
