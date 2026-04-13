import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { CalendarCheck, Plus, Sparkle, Trophy } from "phosphor-react-native";

// Stagger timing constants — top-to-bottom cascade
const DUR = 340;
const SPR = { damping: 22, stiffness: 210 } as const;
const D0 = 0;    // hero card
const D1 = 70;   // white panel
const D2 = 150;  // "Bugün" row
const D3 = 210;  // segmented control
const D4 = 270;  // edge/milestone banners
const D5 = 300;  // "Görevler" header
const D6 = 350;  // task list
const D7 = 400;  // summary cards
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HeroStateRenderer } from "@/src/components/HeroStateRenderer";
import { TaskProgressBanner } from "@/src/components/TaskProgressBanner";
import { GenerationProcessingOverlay } from "@/src/components/GenerationProcessingOverlay";
import { PhotoValueSheet } from "@/src/components/PhotoValueSheet";
import { NotificationPrompt } from "@/src/components/NotificationPrompt";
import { ProductivityScoreSheet } from "@/src/components/ProductivityScoreSheet";
import { TaskCard } from "@/src/components/TaskCard";
import { AnimatedSegmentedControl } from "@/src/components/AnimatedSegmentedControl";
import { useSessionStore } from "@state/useSessionStore";
import { useTodoStore } from "@state/useTodoStore";
import { useFTUEStore } from "@state/useFTUEStore";
import { useFTUE } from "@/src/hooks/useFTUE";
import { useHeroReveal } from "@/src/hooks/useHeroReveal";
import { useEligibilityEngine } from "@/src/hooks/useEligibilityEngine";
import { useTodoVisualGeneration } from "@/src/hooks/useTodoVisualGeneration";
import { usePaywallTrigger } from "@/src/hooks/usePaywallTrigger";
import { useEdgeCases } from "@/src/hooks/useEdgeCases";
import { EdgeCaseBanner } from "@/src/components/EdgeCaseBanner";
import { GenerationErrorSheet } from "@/src/components/GenerationErrorSheet";
import { calculateMockProductivityInsights } from "@/src/utils/productivityScore";
import { useUserScore } from "@/src/hooks/useUserScore";
import { supabase } from "@/src/services/supabase";
import { AISuggestionCard } from "@/src/components/AISuggestionCard";
import { radius, spacing } from "@/src/ui/tokens";

const SEGMENT_KEYS = { habits: "habits", goals: "goals" } as const;

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


export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [isScoreSheetVisible, setIsScoreSheetVisible] = useState(false);
  const [isPhotoSheetVisible, setIsPhotoSheetVisible] = useState(false);
  const [isNotifPromptVisible, setIsNotifPromptVisible] = useState(false);
  const [isErrorSheetVisible, setIsErrorSheetVisible] = useState(false);
  const [isGenerationOverlayVisible, setIsGenerationOverlayVisible] = useState(false);
  const [activeSegment, setActiveSegment] = useState("habits");
  const [homeHeroImageUrl, setHomeHeroImageUrl] = useState<string | null>(null);
  const [starterHeroImageUrl, setStarterHeroImageUrl] = useState<string | null>(null);

  const { profileName } = useSessionStore();
  const {
    todos,
    toggleTodo,
    latestVisual,
    generationError,
    clearGenerationError,
  } = useTodoStore();
  const avatarStatus = useFTUEStore((s) => s.avatarStatus);
  const hasSeenHomeScreen = useFTUEStore((s) => s.hasSeenHomeScreen);
  const { setAvatarStatus, markHomeScreenSeen } = useFTUEStore();

  const { totalPoints } = useUserScore();
  const [avatarReadyBanner, setAvatarReadyBanner] = useState(false);
  const avatarPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    heroVariant,
    taskMilestone,
    shouldShowPhotoValueSheet,
    shouldTriggerPaywall,
    shouldPromptNotification,
    tasksUntilMilestone,
    isSubscribed,
    activeTodoCount,
    totalTodoCount,
    currentHeroTodo,
  } = useFTUE();

  // Drives the eligibility state machine (syncs to useAIVisualStore automatically)
  const { minutesUntilStable } = useEligibilityEngine();

  const {
    dailyHeroStatus,
    dailyHeroImageUrl: revealHeroImageUrl,
    blurAmount: revealBlurAmount,
    progressText: revealProgressText,
    revealProgress,
    isFullyRevealed,
    hasGeneratedToday,
    canShowGenerationCTA,
    handleGenerateCTA,
    handleRetryGeneration,
    checkDailyReset,
    stopPolling,
  } = useHeroReveal();

  const { handleTodoCompleted } = useTodoVisualGeneration();

  useEffect(() => {
    checkDailyReset();
  }, [checkDailyReset]);

  // Mark home screen as seen after the first visit
  useEffect(() => {
    if (!hasSeenHomeScreen) {
      const timer = setTimeout(markHomeScreenSeen, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenHomeScreen, markHomeScreenSeen]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    const checkAvatar = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-home-state", { body: {} });
        if (error || !data) return;

        const resolvedHeroImageUrl =
          data.avatarSummary?.signedUrl ??
          data.avatarSummary?.imageUrl ??
          data.hero?.signedVisualUrl ??
          data.hero?.activeVisualUrl ??
          null;
        setHomeHeroImageUrl(resolvedHeroImageUrl);

        const resolvedStarterHeroUrl =
          data.starterHeroSummary?.signedUrl ??
          data.starterHeroSummary?.imageUrl ??
          null;
        setStarterHeroImageUrl(resolvedStarterHeroUrl);

        if (data.avatarSummary?.id) {
          const wasProcessing = avatarStatus === "processing";
          setAvatarStatus("ready");
          if (wasProcessing) setAvatarReadyBanner(true);
          if (avatarPollRef.current) {
            clearInterval(avatarPollRef.current);
            avatarPollRef.current = null;
          }
        }
      } catch {
        // Silent fail
      }
    };

    checkAvatar();

    if (avatarStatus === "processing") {
      avatarPollRef.current = setInterval(checkAvatar, 5_000);
      return () => {
        if (avatarPollRef.current) clearInterval(avatarPollRef.current);
      };
    }
  }, [avatarStatus]);

  const { triggerPaywallIfEligible, triggerPassivePaywall } =
    usePaywallTrigger();

  const { primaryEdgeCase, getEdgeCaseMessage } = useEdgeCases();
  const edgeCaseMessage = getEdgeCaseMessage(primaryEdgeCase);

  const visibleTodos = todos.filter((t) => t.deletedAt == null);
  const completedCount = visibleTodos.filter((item) => item.isCompleted).length;
  const activeCount = visibleTodos.length - completedCount;
  const completionRate = visibleTodos.length
    ? Math.round((completedCount / visibleTodos.length) * 100)
    : 0;
  const allDone = visibleTodos.length > 0 && completedCount === visibleTodos.length;
  const productivityInsights = useMemo(
    () => calculateMockProductivityInsights(todos),
    [todos],
  );

  const isHabitRecurrence = (r: string) =>
    r === "daily" || r === "weekly" || r === "weekend" || r === "weekdays" || r === "custom";

  const filteredTodos = useMemo(() => {
    if (activeSegment === "habits") {
      return todos.filter(
        (t) => t.deletedAt == null && isHabitRecurrence(t.recurrence) && !t.isCompleted,
      );
    }
    return todos.filter(
      (t) => t.deletedAt == null && t.recurrence === "once" && !t.isCompleted,
    );
  }, [todos, activeSegment]);

  const habitsCount = useMemo(
    () =>
      todos.filter(
        (t) => t.deletedAt == null && isHabitRecurrence(t.recurrence) && !t.isCompleted,
      ).length,
    [todos],
  );

  const goalsCount = useMemo(
    () =>
      todos.filter(
        (t) => t.deletedAt == null && t.recurrence === "once" && !t.isCompleted,
      ).length,
    [todos],
  );

  const segments = useMemo(
    () => [
      { key: SEGMENT_KEYS.habits, label: "Alışkanlıklar", badge: habitsCount },
      { key: SEGMENT_KEYS.goals, label: "Hedefler", badge: goalsCount },
    ],
    [habitsCount, goalsCount],
  );

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

  const handleToggleTodo = useCallback(
    (id: string) => {
      const todo = todos.find((t) => t.id === id);
      const isCompleting = todo && !todo.isCompleted;
      toggleTodo(id);
      if (isCompleting) {
        handleTodoCompleted(id);
      }
    },
    [todos, toggleTodo, handleTodoCompleted],
  );

  const handlePressPremium = useCallback(() => {
    triggerPassivePaywall();
  }, [triggerPassivePaywall]);

  const effectiveHeroVariant = useMemo(() => {
    // reveal state'leri her zaman önce (useFTUE zaten handle ediyor ama doubly safe)
    if (
      heroVariant === "locked_reveal" ||
      heroVariant === "fully_revealed"
    ) {
      return heroVariant;
    }

    // premium_teaser hiçbir zaman override edilmemeli
    if (heroVariant === "premium_teaser") return heroVariant;

    // starterHero görseli varsa belirli boş state'leri starter_hero'ya yükselt
    if (
      starterHeroImageUrl &&
      (heroVariant === "empty" ||
        heroVariant === "need_more_todos" ||
        heroVariant === "placeholder")
    ) {
      return "starter_hero" as const;
    }

    // homeHeroImageUrl varsa belirli geçici state'leri gerçek görsele yükselt
    if (homeHeroImageUrl) {
      if (
        heroVariant === "profile_generating" ||
        heroVariant === "placeholder" ||
        heroVariant === "empty" ||
        heroVariant === "need_more_todos"
      ) {
        return "todo_visual";
      }
    }

    return heroVariant;
  }, [heroVariant, homeHeroImageUrl, starterHeroImageUrl]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          entering={FadeIn.delay(D0).duration(DUR)}
          style={[styles.heroTapArea, { marginTop: insets.top + 8 }]}
        >
          <TouchableOpacity
            activeOpacity={currentHeroTodo?.visualUrl ? 0.88 : 1}
          >
            <HeroStateRenderer
              variant={effectiveHeroVariant}
              visual={latestVisual}
              heroImageUrl={homeHeroImageUrl}
              starterHeroImageUrl={starterHeroImageUrl}
              currentTodoTitle={currentHeroTodo?.title ?? null}
              currentTodoVisualUrl={currentHeroTodo?.visualUrl ?? null}
              productivityScore={totalPoints}
              tasksUntilMilestone={tasksUntilMilestone}
              totalTodoCount={totalTodoCount}
              onPressAssistant={() => router.push("/ai-assistant")}
              onPressScore={() => setIsScoreSheetVisible(true)}
              onPressUploadPhoto={() => setIsPhotoSheetVisible(true)}
              onPressPremium={handlePressPremium}
              revealBlurAmount={revealBlurAmount}
              revealProgressText={revealProgressText}
              revealProgress={revealProgress}
              isFullyRevealed={isFullyRevealed}
              dailyHeroImageUrl={revealHeroImageUrl}
              minutesUntilStable={minutesUntilStable}
            />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(D1).duration(DUR).springify().damping(SPR.damping).stiffness(SPR.stiffness)}
          style={styles.panelWrap}
        >
          <View style={styles.taskPanel}>
            <View style={styles.dragHandle} />

            {!hasSeenHomeScreen && (
              <Animated.View
                entering={FadeInDown.delay(D2).duration(DUR).springify().damping(SPR.damping).stiffness(SPR.stiffness)}
                style={styles.welcomeBanner}
              >
                <Text style={styles.welcomeEmoji}>👋</Text>
                <View style={styles.welcomeTextWrap}>
                  <Text style={styles.welcomeTitle}>
                    Hoş geldin{profileName ? `, ${profileName}` : ""}!
                  </Text>
                  <Text style={styles.welcomeDesc}>
                    Görev ekleyip tamamladıkça puan kazan. Her adım seni daha üretken yapıyor.
                  </Text>
                </View>
              </Animated.View>
            )}

            <Animated.View
              entering={FadeInDown.delay(D2).duration(DUR).springify().damping(SPR.damping).stiffness(SPR.stiffness)}
              style={styles.sectionHeader}
            >
              <Text style={styles.sectionTitle}>Bugün</Text>
              <View style={styles.calendarPill}>
                <CalendarCheck size={17} color="#111111" weight="regular" />
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(D3).duration(DUR).springify().damping(SPR.damping).stiffness(SPR.stiffness)}
              style={{ marginBottom: 14 }}
            >
              <AnimatedSegmentedControl
                tabs={segments.map((s) => ({ label: s.label, badge: s.badge }))}
                activeIndex={activeSegment === SEGMENT_KEYS.habits ? 0 : 1}
                onChange={(i) =>
                  setActiveSegment(
                    i === 0 ? SEGMENT_KEYS.habits : SEGMENT_KEYS.goals,
                  )
                }
              />
            </Animated.View>

            {edgeCaseMessage && primaryEdgeCase !== "insufficient_tasks" && (
              <Animated.View
                entering={FadeInDown.delay(D4).duration(DUR).springify().damping(SPR.damping).stiffness(SPR.stiffness)}
              >
                <EdgeCaseBanner
                  edgeCase={primaryEdgeCase}
                  title={edgeCaseMessage.title}
                  subtitle={edgeCaseMessage.subtitle}
                  onAction={() => {
                    if (
                      primaryEdgeCase === "paywall_dismissed" ||
                      primaryEdgeCase === "subscription_expired"
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
              </Animated.View>
            )}

            {taskMilestone !== "no_tasks" && (
              <Animated.View
                entering={FadeInDown.delay(D4).duration(DUR).springify().damping(SPR.damping).stiffness(SPR.stiffness)}
              >
                <TaskProgressBanner
                  milestoneStatus={taskMilestone}
                  tasksUntilMilestone={tasksUntilMilestone}
                  activeTodoCount={totalTodoCount}
                  isSubscribed={isSubscribed}
                  hasGeneratedToday={hasGeneratedToday}
                  onPressGenerate={handleGenerateCTA}
                />
              </Animated.View>
            )}

            <Animated.View
              entering={FadeInDown.delay(D5 - 30).duration(DUR).springify().damping(SPR.damping).stiffness(SPR.stiffness)}
              style={{ marginBottom: 12 }}
            >
              <AISuggestionCard />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(D5).duration(DUR).springify().damping(SPR.damping).stiffness(SPR.stiffness)}
              style={styles.taskHeader}
            >
              <Text style={styles.taskHeaderText}>Görevler</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{filteredTodos.length}</Text>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(D6).duration(DUR).springify().damping(SPR.damping).stiffness(SPR.stiffness)}
            >
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
                    <Trophy size={22} color="#111111" weight="fill" />
                  </View>
                  <Text style={styles.completedTitle}>Tebrikler!</Text>
                  <Text style={styles.completedDesc}>
                    Bugünkü tüm görevlerini tamamladın.
                  </Text>
                </View>
              ) : filteredTodos.length === 0 ? (
                <View style={styles.empty}>
                  <View style={styles.emptyIconWrap}>
                    <Plus size={20} color="rgba(17,17,17,0.35)" weight="bold" />
                  </View>
                  <Text style={styles.emptyTitle}>
                    3 görev ekle, görselin oluşsun
                  </Text>
                  <Text style={styles.emptyDesc}>
                    Yapay zekâ görevlerini analiz edip sana özel bir sahne oluşturuyor.
                  </Text>
                  <View style={styles.emptyActionRow}>
                    <TouchableOpacity
                      style={styles.emptyActionButtonPrimary}
                      onPress={() => router.push("/ai-assistant")}
                      activeOpacity={0.82}
                      accessibilityRole="button"
                      accessibilityLabel="AI asistanıyla görev ekle"
                    >
                      <Sparkle size={13} color="#FAFAF9" weight="fill" />
                      <Text style={styles.emptyActionTextPrimary}>AI ile Ekle</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.emptyActionButtonSecondary}
                      onPress={() => router.push("/todo/new")}
                      activeOpacity={0.82}
                      accessibilityRole="button"
                      accessibilityLabel="Manuel görev ekle"
                    >
                      <Plus size={13} color="#111111" weight="bold" />
                      <Text style={styles.emptyActionTextSecondary}>Manuel Ekle</Text>
                    </TouchableOpacity>
                  </View>
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
                    onToggle={() => handleToggleTodo(item.id)}
                    onPress={() => router.push(`/todo/${item.id}`)}
                  />
                ))
              )}
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(D7).duration(DUR).springify().damping(SPR.damping).stiffness(SPR.stiffness)}
              style={styles.statsContainer}
            >
              <TouchableOpacity
                style={styles.statCell}
                onPress={() => router.push("/stats/completed")}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Tamamlanan ekranını aç"
              >
                <Text style={styles.statValue}>{completedCount}</Text>
                <Text style={styles.statLabel}>Tamamlanan</Text>
              </TouchableOpacity>

              <View style={styles.statDivider} />

              <TouchableOpacity
                style={styles.statCell}
                onPress={() => router.push("/stats/active")}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Aktif ekranını aç"
              >
                <Text style={styles.statValue}>{activeCount}</Text>
                <Text style={styles.statLabel}>Aktif</Text>
              </TouchableOpacity>

              <View style={styles.statDivider} />

              <TouchableOpacity
                style={styles.statCell}
                onPress={() => router.push("/stats/completion")}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Tamamlama oranı ekranını aç"
              >
                <Text style={styles.statValue}>%{completionRate}</Text>
                <Text style={styles.statLabel}>Oran</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
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
        onRetry={handleRetryGeneration}
        onClose={() => setIsErrorSheetVisible(false)}
      />

      <GenerationProcessingOverlay
        visible={isGenerationOverlayVisible}
        onDismiss={() => setIsGenerationOverlayVisible(false)}
      />

      {avatarReadyBanner && (
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={styles.avatarReadyBanner}
        >
          <View style={styles.avatarReadyIcon}>
            <Sparkle size={20} color="#3A2E28" weight="fill" />
          </View>
          <View style={styles.avatarReadyTextWrap}>
            <Text style={styles.avatarReadyTitle}>Profilin hazır!</Text>
            <Text style={styles.avatarReadyDesc}>
              Artık görsellerin sana özel üretilecek.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setAvatarReadyBanner(false);
              router.push("/profile-reveal");
            }}
            style={styles.avatarReadyClose}
            accessibilityRole="button"
            accessibilityLabel="Göster"
          >
            <Text style={styles.avatarReadyCloseText}>Göster</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
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
    zIndex: 1,
  },
  panelWrap: {
    marginTop: -44,
    zIndex: 10,
    marginHorizontal: 14,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: HOME_LAYER.panel,
    overflow: "hidden",
  },
  taskPanel: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: HOME_LAYER.panel,
    borderWidth: 1,
    borderColor: HOME_LAYER.border,
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: spacing.xl,
    marginHorizontal: 0,
    ...HOME_CARD_SHADOW,
    elevation: 12,
  },
  dragHandle: {
    alignSelf: "center",
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.12)",
    marginBottom: 14,
  },
  welcomeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: HOME_LAYER.inset,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: HOME_LAYER.border,
    padding: 14,
    marginBottom: 14,
  },
  welcomeEmoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  welcomeTextWrap: {
    flex: 1,
    gap: 3,
  },
  welcomeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
    lineHeight: 20,
  },
  welcomeDesc: {
    fontSize: 13,
    color: "rgba(17,17,17,0.52)",
    lineHeight: 18,
    fontWeight: "400",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.4,
  },
  calendarPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
    letterSpacing: -0.1,
  },
  badge: {
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: HOME_LAYER.inset,
    borderWidth: 1,
    borderColor: HOME_LAYER.border,
    alignItems: "center",
  },
  badgeText: {
    color: "rgba(17, 17, 17, 0.55)",
    fontSize: 11,
    fontWeight: "600",
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
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    backgroundColor: HOME_LAYER.inset,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: HOME_LAYER.panel,
    borderWidth: 1,
    borderColor: HOME_LAYER.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "600",
    color: "#111111",
    textAlign: "center",
    letterSpacing: -0.1,
  },
  emptyDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(17, 17, 17, 0.48)",
    textAlign: "center",
    maxWidth: 240,
  },
  emptyActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  emptyActionButtonPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "#111111",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyActionTextPrimary: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FAFAF9",
  },
  emptyActionButtonSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: HOME_LAYER.panel,
    borderWidth: 1,
    borderColor: HOME_LAYER.borderStrong,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyActionTextSecondary: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111111",
  },
  completedBanner: {
    borderRadius: 20,
    backgroundColor: HOME_LAYER.inset,
    borderWidth: 1,
    borderColor: HOME_LAYER.border,
    paddingVertical: 24,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  completedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: HOME_LAYER.panel,
    borderWidth: 1,
    borderColor: HOME_LAYER.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  completedTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111111",
  },
  completedDesc: {
    fontSize: 13,
    color: "rgba(17, 17, 17, 0.52)",
    textAlign: "center",
    lineHeight: 18,
  },
  statsContainer: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: HOME_LAYER.inset,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: HOME_LAYER.border,
    overflow: "hidden",
  },
  statCell: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    gap: 3,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: HOME_LAYER.borderStrong,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(17, 17, 17, 0.48)",
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  avatarReadyBanner: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAF9",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    ...HOME_CARD_SHADOW,
  },
  avatarReadyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0E8DD",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarReadyTextWrap: {
    flex: 1,
    gap: 2,
  },
  avatarReadyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  avatarReadyDesc: {
    fontSize: 12,
    color: "rgba(17, 17, 17, 0.55)",
  },
  avatarReadyClose: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#3A2E28",
  },
  avatarReadyCloseText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
