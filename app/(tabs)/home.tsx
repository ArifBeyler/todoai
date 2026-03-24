import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CalendarCheck, Trophy } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HeroStateRenderer } from "@/src/components/HeroStateRenderer";
import { TaskProgressBanner } from "@/src/components/TaskProgressBanner";
import { PhotoValueSheet } from "@/src/components/PhotoValueSheet";
import { NotificationPrompt } from "@/src/components/NotificationPrompt";
import { ProductivityScoreSheet } from "@/src/components/ProductivityScoreSheet";
import { TaskCard } from "@/src/components/TaskCard";
import { SegmentedControl } from "@/src/components/SegmentedControl";
import { useSessionStore } from "@state/useSessionStore";
import { useTodoStore } from "@state/useTodoStore";
import { useFTUEStore } from "@state/useFTUEStore";
import { useFTUE } from "@/src/hooks/useFTUE";
import { usePaywallTrigger } from "@/src/hooks/usePaywallTrigger";
import { useEdgeCases } from "@/src/hooks/useEdgeCases";
import { EdgeCaseBanner } from "@/src/components/EdgeCaseBanner";
import { GenerationErrorSheet } from "@/src/components/GenerationErrorSheet";
import { calculateMockProductivityInsights } from "@/src/utils/productivityScore";
import { radius, spacing } from "@/src/ui/tokens";

const SEGMENTS = [
  { key: "habits", label: "Günlük alışkanlıklar" },
  { key: "goals", label: "Hedefler" },
];

const HOME_LAYER = {
  bg: "#F2F2F0",
  panel: "#FAFAF9",
  inset: "#EDEDEB",
  border: "rgba(0, 0, 0, 0.04)",
  borderStrong: "rgba(0, 0, 0, 0.08)",
} as const;

const HOME_CARD_SHADOW = {
  shadowColor: "rgba(0, 0, 0, 0.06)",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 1,
  shadowRadius: 24,
  elevation: 6,
} as const;

const HOME_RAISED_ITEM_SHADOW = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
} as const;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [isScoreSheetVisible, setIsScoreSheetVisible] = useState(false);
  const [isPhotoSheetVisible, setIsPhotoSheetVisible] = useState(false);
  const [isNotifPromptVisible, setIsNotifPromptVisible] = useState(false);
  const [isErrorSheetVisible, setIsErrorSheetVisible] = useState(false);
  const [activeSegment, setActiveSegment] = useState("habits");

  const { profileName } = useSessionStore();
  const {
    todos,
    toggleTodo,
    latestVisual,
    isGenerating,
    generationError,
    clearGenerationError,
  } = useTodoStore();
  const { setAvatarStatus, setGenerationEligibility } = useFTUEStore();

  const {
    heroVariant,
    taskMilestone,
    shouldShowPhotoValueSheet,
    shouldTriggerPaywall,
    shouldPromptNotification,
    canTriggerGeneration,
    tasksUntilMilestone,
    isSubscribed,
    activeTodoCount,
  } = useFTUE();

  const { triggerPaywallIfEligible, triggerPassivePaywall } =
    usePaywallTrigger();

  const { primaryEdgeCase, getEdgeCaseMessage } = useEdgeCases();
  const edgeCaseMessage = getEdgeCaseMessage(primaryEdgeCase);

  const completedCount = todos.filter((item) => item.isCompleted).length;
  const activeCount = todos.length - completedCount;
  const completionRate = todos.length
    ? Math.round((completedCount / todos.length) * 100)
    : 0;
  const allDone = todos.length > 0 && completedCount === todos.length;
  const productivityInsights = useMemo(
    () => calculateMockProductivityInsights(todos),
    [todos],
  );

  const filteredTodos = useMemo(() => {
    if (activeSegment === "habits") {
      return todos.filter(
        (t) =>
          (t.recurrence === "daily" ||
            t.recurrence === "weekly" ||
            t.recurrence === "weekend") &&
          !t.isCompleted,
      );
    }
    return todos.filter((t) => t.recurrence === "once" && !t.isCompleted);
  }, [todos, activeSegment]);

  useEffect(() => {
    if (shouldShowPhotoValueSheet) {
      setIsPhotoSheetVisible(true);
    }
  }, [shouldShowPhotoValueSheet]);

  useEffect(() => {
    if (shouldTriggerPaywall) {
      triggerPaywallIfEligible();
    }
  }, [shouldTriggerPaywall, triggerPaywallIfEligible]);

  useEffect(() => {
    if (shouldPromptNotification && !isNotifPromptVisible) {
      const timer = setTimeout(() => setIsNotifPromptVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [shouldPromptNotification, isNotifPromptVisible]);

  const handlePhotoUploaded = useCallback(() => {
    setAvatarStatus("processing");
  }, [setAvatarStatus]);

  const handleTriggerGeneration = useCallback(() => {
    if (!canTriggerGeneration) return;
    setGenerationEligibility("pending");
  }, [canTriggerGeneration, setGenerationEligibility]);

  const handlePressPremium = useCallback(() => {
    triggerPassivePaywall();
  }, [triggerPassivePaywall]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[styles.heroTapArea, { marginTop: insets.top + 8 }]}
          activeOpacity={latestVisual ? 0.88 : 1}
          onPress={() =>
            latestVisual && router.push(`/visual/${latestVisual.id}`)
          }
        >
          <HeroStateRenderer
            variant={heroVariant}
            visual={latestVisual}
            productivityScore={productivityInsights.score}
            tasksUntilMilestone={tasksUntilMilestone}
            onPressAssistant={() => router.push("/ai-assistant")}
            onPressScore={() => setIsScoreSheetVisible(true)}
            onPressUploadPhoto={() => setIsPhotoSheetVisible(true)}
            onPressPremium={handlePressPremium}
          />
        </TouchableOpacity>

        <View style={styles.panelWrap}>
          <View style={styles.taskPanel}>
            <View style={styles.dragHandle} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Bugün</Text>
              <View style={styles.calendarPill}>
                <CalendarCheck
                  size={17}
                  color="#111111"
                  weight="regular"
                />
              </View>
            </View>

            <View style={{ marginBottom: 14 }}>
              <SegmentedControl
                segments={SEGMENTS}
                activeKey={activeSegment}
                onSelect={setActiveSegment}
              />
            </View>

            {edgeCaseMessage && primaryEdgeCase !== "insufficient_tasks" && (
              <EdgeCaseBanner
                edgeCase={primaryEdgeCase}
                title={edgeCaseMessage.title}
                subtitle={edgeCaseMessage.subtitle}
                onAction={() => {
                  if (
                    primaryEdgeCase === "paywall_dismissed" ||
                    primaryEdgeCase === "trial_expired"
                  ) {
                    handlePressPremium();
                  } else if (
                    primaryEdgeCase === "subscribed_no_photo" ||
                    primaryEdgeCase === "photo_skipped" ||
                    primaryEdgeCase === "photo_failed"
                  ) {
                    setIsPhotoSheetVisible(true);
                  } else if (primaryEdgeCase === "generation_failed") {
                    setIsErrorSheetVisible(true);
                  }
                }}
              />
            )}

            {taskMilestone !== "no_tasks" && (
              <TaskProgressBanner
                milestoneStatus={taskMilestone}
                tasksUntilMilestone={tasksUntilMilestone}
                activeTodoCount={activeTodoCount}
                isSubscribed={isSubscribed}
                onPressGenerate={handleTriggerGeneration}
              />
            )}

            <View style={styles.taskHeader}>
              <Text style={styles.taskHeaderText}>Görevler</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{filteredTodos.length}</Text>
              </View>
            </View>

            {generationError ? (
              <TouchableOpacity
                onPress={clearGenerationError}
                style={styles.errorBanner}
              >
                <Text style={styles.errorText}>{generationError}</Text>
              </TouchableOpacity>
            ) : null}

            {allDone ? (
              <View style={styles.completedBanner}>
                <View style={styles.completedIconWrap}>
                  <Trophy size={24} color="#111111" weight="fill" />
                </View>
                <Text style={styles.completedTitle}>Tebrikler!</Text>
                <Text style={styles.completedDesc}>
                  Bugünkü tüm görevlerini tamamladın.
                </Text>
              </View>
            ) : filteredTodos.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>
                  Henüz görev eklenmedi
                </Text>
                <Text style={styles.emptyDesc}>
                  Aşağıdaki + ile ilk görevinizi oluşturun.
                </Text>
              </View>
            ) : (
              filteredTodos.map((item) => (
                <TaskCard
                  key={item.id}
                  title={item.title}
                  category={item.category}
                  priority={item.priority}
                  isCompleted={item.isCompleted}
                  recurrence={item.recurrence}
                  onToggle={() => toggleTodo(item.id)}
                  onPress={() => router.push(`/todo/${item.id}`)}
                />
              ))
            )}

            <View style={styles.summaryWrap}>
              <TouchableOpacity
                style={styles.summaryCard}
                onPress={() => router.push("/stats/completed")}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Tamamlanan ekranını aç"
              >
                <Text style={styles.summaryValue}>{completedCount}</Text>
                <Text style={styles.summaryLabel}>Tamamlanan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.summaryCard}
                onPress={() => router.push("/stats/active")}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Aktif ekranını aç"
              >
                <Text style={styles.summaryValue}>{activeCount}</Text>
                <Text style={styles.summaryLabel}>Aktif</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.summaryCard}
                onPress={() => router.push("/stats/completion")}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Tamamlama ekranını aç"
              >
                <Text style={styles.summaryValue}>%{completionRate}</Text>
                <Text style={styles.summaryLabel}>Tamamlama</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <ProductivityScoreSheet
        visible={isScoreSheetVisible}
        insights={productivityInsights}
        onClose={() => setIsScoreSheetVisible(false)}
      />

      <PhotoValueSheet
        visible={isPhotoSheetVisible}
        onClose={() => setIsPhotoSheetVisible(false)}
        onPhotoUploaded={handlePhotoUploaded}
      />

      <NotificationPrompt
        visible={isNotifPromptVisible}
        onClose={() => setIsNotifPromptVisible(false)}
      />

      <GenerationErrorSheet
        visible={isErrorSheetVisible}
        errorType="generation_failed"
        onRetry={handleTriggerGeneration}
        onClose={() => setIsErrorSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HOME_LAYER.bg,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroTapArea: {
    marginHorizontal: 14,
  },
  panelWrap: {
    marginTop: -52,
    zIndex: 3,
    marginHorizontal: 14,
  },
  taskPanel: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: HOME_LAYER.panel,
    borderWidth: 1,
    borderColor: HOME_LAYER.border,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: spacing.xl,
    marginHorizontal: 0,
    ...HOME_CARD_SHADOW,
  },
  dragHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDDBD7",
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.5,
  },
  calendarPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: HOME_LAYER.inset,
    borderWidth: 1,
    borderColor: HOME_LAYER.border,
    alignItems: "center",
    justifyContent: "center",
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  taskHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111111",
  },
  badge: {
    minWidth: 26,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: HOME_LAYER.inset,
    borderWidth: 1,
    borderColor: HOME_LAYER.border,
    alignItems: "center",
  },
  badgeText: {
    color: "rgba(17, 17, 17, 0.7)",
    fontSize: 12,
    fontWeight: "700",
  },
  errorBanner: {
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: HOME_LAYER.inset,
    borderWidth: 1,
    borderColor: HOME_LAYER.border,
    padding: spacing.sm,
  },
  errorText: {
    color: "rgba(17, 17, 17, 0.6)",
    fontSize: 13,
  },
  empty: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: HOME_LAYER.borderStrong,
    borderStyle: "dashed",
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    backgroundColor: HOME_LAYER.inset,
  },
  emptyTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "600",
    color: "#111111",
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(17, 17, 17, 0.5)",
    textAlign: "center",
  },
  completedBanner: {
    borderRadius: 18,
    backgroundColor: HOME_LAYER.inset,
    borderWidth: 1,
    borderColor: HOME_LAYER.border,
    paddingVertical: 20,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    marginBottom: spacing.sm,
    ...HOME_CARD_SHADOW,
    shadowRadius: 12,
  },
  completedIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: HOME_LAYER.panel,
    borderWidth: 1,
    borderColor: HOME_LAYER.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },
  completedDesc: {
    fontSize: 13,
    color: "rgba(17, 17, 17, 0.55)",
    textAlign: "center",
  },
  summaryWrap: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: HOME_LAYER.panel,
    borderWidth: 1,
    borderColor: HOME_LAYER.borderStrong,
    paddingVertical: 11,
    alignItems: "center",
    ...HOME_RAISED_ITEM_SHADOW,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(17, 17, 17, 0.55)",
    fontWeight: "500",
  },
});
