import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  CalendarBlank,
  CheckCircle,
  Circle,
  Clock,
  Fire,
  NotePencil,
  Repeat,
  Tag,
  Trash,
  Warning,
} from "phosphor-react-native";
import { useTodoStore } from "@state/useTodoStore";
import { resolveTodoIcon } from "@/src/utils/resolveTodoIcon";
import { radius, spacing } from "@/src/ui/tokens";

const PRIORITY_META: Record<string, { label: string; accent: string; bg: string }> = {
  low: { label: "Düşük", accent: "#76A28A", bg: "#ECF5F1" },
  medium: { label: "Orta", accent: "#C28B58", bg: "#F7EEE5" },
  high: { label: "Yüksek", accent: "#C86A62", bg: "#F9EBE9" },
};

const RECURRENCE_MAP: Record<string, string> = {
  once: "Bir kez",
  daily: "Her gün",
  weekly: "Her hafta",
  weekend: "Hafta sonu",
};

const CATEGORY_LABELS: Record<string, string> = {
  housework: "Ev İşi",
  sports: "Spor",
  work: "İş",
  social: "Sosyal",
  shopping: "Alışveriş",
  health: "Sağlık",
  education: "Eğitim",
  other: "Diğer",
};

const LAYER = {
  bg: "#F5F5F3",
  card: "#FBFBFA",
  inset: "#F5F5F3",
  border: "rgba(0, 0, 0, 0.04)",
  divider: "rgba(0, 0, 0, 0.06)",
} as const;

const CARD_SHADOW = {
  shadowColor: "rgba(0, 0, 0, 0.06)",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 1,
  shadowRadius: 30,
  elevation: 8,
} as const;

const BUTTON_SHADOW = {
  shadowColor: "rgba(79, 143, 107, 0.24)",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 1,
  shadowRadius: 18,
  elevation: 5,
} as const;

export default function TodoDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const { todos, removeTodo, updateTodo, toggleTodo, generateVisualForTodo, isGenerating } = useTodoStore();
  const todo = useMemo(() => todos.find((item) => item.id === params.id), [params.id, todos]);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo?.title ?? "");

  if (!todo) {
    return (
      <View style={styles.notFound}>
        <Warning size={40} color="#8A7A70" weight="regular" />
        <Text style={styles.notFoundText}>Görev bulunamadı</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.notFoundButton}
          accessibilityRole="button"
        >
          <Text style={styles.notFoundButtonText}>Geri dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const priorityMeta = PRIORITY_META[todo.priority] ?? PRIORITY_META.medium;
  const categoryLabel = CATEGORY_LABELS[todo.category] ?? todo.category;
  const resolvedIcon = useMemo(() => resolveTodoIcon(todo.title, todo.category), [todo.title, todo.category]);
  const HeroIcon = resolvedIcon.Icon;

  const handleSave = () => {
    updateTodo(todo.id, { title: editTitle.trim() || todo.title });
    setIsEditing(false);
  };

  const handleDelete = () => {
    removeTodo(todo.id);
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <ArrowLeft size={20} color="#3A2E28" weight="bold" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Görev Detayı</Text>
          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            style={styles.editButton}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Düzenle"
          >
            <NotePencil size={20} color="#3A2E28" weight="regular" />
          </TouchableOpacity>
        </View>

        {/* Hero card */}
        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <HeroIcon size={30} color={resolvedIcon.color} weight="duotone" />
            </View>

            {isEditing ? (
              <TextInput
                style={styles.titleInput}
                value={editTitle}
                onChangeText={setEditTitle}
                multiline
                autoFocus
              />
            ) : (
              <View style={styles.titleWrap}>
                <Text style={[styles.taskTitle, todo.isCompleted && styles.taskTitleDone]}>{todo.title}</Text>
                {todo.isCompleted ? (
                  <View style={styles.completedHint}>
                    <CheckCircle size={15} color="#6E9A80" weight="fill" />
                    <Text style={styles.completedHintText}>Tamamlandı</Text>
                  </View>
                ) : null}
              </View>
            )}

            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, todo.isCompleted ? styles.statusDone : styles.statusActive]}>
                <Text style={[styles.statusText, todo.isCompleted ? styles.statusTextDone : styles.statusTextActive]}>
                  {todo.isCompleted ? "Tamamlanan" : "Aktif"}
                </Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: priorityMeta.bg }]}>
                <View style={[styles.priorityDot, { backgroundColor: priorityMeta.accent }]} />
                <Text style={[styles.priorityBadgeText, { color: priorityMeta.accent }]}>
                  {priorityMeta.label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info section */}
        <View style={styles.infoWrap}>
          <View style={styles.infoCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <View style={styles.detailIconWrap}>
                  <Tag size={16} color="rgba(17, 17, 17, 0.64)" weight="duotone" />
                </View>
                <Text style={styles.detailLabel}>Kategori</Text>
              </View>
              <Text style={styles.detailValue}>{categoryLabel}</Text>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <View style={styles.detailIconWrap}>
                  <Repeat size={16} color="rgba(17, 17, 17, 0.64)" weight="duotone" />
                </View>
                <Text style={styles.detailLabel}>Tekrar</Text>
              </View>
              <Text style={styles.detailValue}>{RECURRENCE_MAP[todo.recurrence]}</Text>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <View style={styles.detailIconWrap}>
                  <CalendarBlank size={16} color="rgba(17, 17, 17, 0.64)" weight="duotone" />
                </View>
                <Text style={styles.detailLabel}>Oluşturulma</Text>
              </View>
              <Text style={styles.detailValue}>
                {new Date(todo.createdAt).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.toggleButton, todo.isCompleted && styles.toggleDone]}
            onPress={() => toggleTodo(todo.id)}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            {todo.isCompleted ? (
              <CheckCircle size={20} color="#4F8F6B" weight="fill" />
            ) : (
              <Circle size={20} color="#4F8F6B" weight="regular" />
            )}
            <Text style={[styles.toggleText, todo.isCompleted && styles.toggleTextDone]}>
              {todo.isCompleted ? "Tamamlandı — Geri Al" : "Tamamlandı Olarak İşaretle"}
            </Text>
          </TouchableOpacity>

          {isEditing ? (
            <TouchableOpacity
              style={[styles.primaryButton, BUTTON_SHADOW]}
              onPress={handleSave}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Değişiklikleri Kaydet</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleDelete}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Trash size={18} color="#C86A62" weight="regular" />
            <Text style={styles.dangerButtonText}>Görevi Sil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LAYER.bg,
  },
  scrollContent: {
    paddingBottom: 56,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: LAYER.bg,
  },
  notFoundText: {
    fontSize: 17,
    color: "#5C4E46",
    fontWeight: "600",
  },
  notFoundButton: {
    marginTop: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: "#EBECE8",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: LAYER.border,
  },
  notFoundButtonText: {
    color: "#111111",
    fontSize: 14,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LAYER.card,
    borderWidth: 1,
    borderColor: LAYER.border,
    alignItems: "center",
    justifyContent: "center",
    ...CARD_SHADOW,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111111",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LAYER.card,
    borderWidth: 1,
    borderColor: LAYER.border,
    alignItems: "center",
    justifyContent: "center",
    ...CARD_SHADOW,
  },
  heroWrap: {
    marginHorizontal: 14,
  },
  heroCard: {
    borderRadius: 30,
    backgroundColor: LAYER.card,
    borderWidth: 1,
    borderColor: LAYER.border,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
    ...CARD_SHADOW,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
  },
  titleWrap: {
    width: "100%",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    justifyContent: "center",
    width: "100%",
    flexWrap: "wrap",
  },
  statusBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  statusActive: {
    backgroundColor: "#F0F3F7",
  },
  statusDone: {
    backgroundColor: "#E8F3EC",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusTextActive: {
    color: "#6A7688",
  },
  statusTextDone: {
    color: "#4F8F6B",
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  taskTitle: {
    fontSize: 30,
    lineHeight: 35,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  taskTitleDone: {
    color: "rgba(17, 17, 17, 0.52)",
  },
  completedHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#E8F3EC",
  },
  completedHintText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F8F6B",
  },
  titleInput: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: "#111111",
    borderWidth: 1,
    borderColor: LAYER.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: LAYER.inset,
    width: "100%",
  },
  infoWrap: {
    marginHorizontal: 14,
    marginTop: spacing.lg,
  },
  infoCard: {
    borderRadius: radius.lg,
    backgroundColor: LAYER.card,
    borderWidth: 1,
    borderColor: LAYER.border,
    paddingHorizontal: spacing.md,
    ...CARD_SHADOW,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 60,
    gap: spacing.sm,
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  detailIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: {
    fontSize: 15,
    color: "rgba(17, 17, 17, 0.56)",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },
  detailDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LAYER.divider,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: radius.lg,
    paddingVertical: 16,
    backgroundColor: "#E8F3EC",
    ...BUTTON_SHADOW,
  },
  toggleDone: {
    backgroundColor: "#DDEEE4",
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4F8F6B",
  },
  toggleTextDone: {
    color: "#3D7B59",
  },
  actions: {
    marginTop: spacing.xl,
    marginHorizontal: 14,
    gap: spacing.md,
  },
  primaryButton: {
    borderRadius: radius.lg,
    backgroundColor: "#F0F3F7",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: LAYER.border,
  },
  primaryButtonText: {
    color: "#5E6E86",
    fontWeight: "700",
    fontSize: 16,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
    backgroundColor: LAYER.card,
    borderWidth: 1,
    borderColor: "rgba(200, 106, 98, 0.28)",
    paddingVertical: 16,
  },
  dangerButtonText: {
    color: "rgba(200, 106, 98, 0.92)",
    fontWeight: "600",
    fontSize: 15,
  },
});
