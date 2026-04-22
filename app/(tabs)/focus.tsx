import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  ArrowCounterClockwise,
  ClockCounterClockwise,
  Lightning,
  Pause,
  Play,
  Trophy,
  X,
} from "phosphor-react-native";

import { CircularTimer } from "@/src/components/CircularTimer";
import { TodoSelector } from "@/src/components/TodoSelector";
import { DurationPicker } from "@/src/components/DurationPicker";
import { FaceDownToggle } from "@/src/components/FaceDownToggle";
import { AnimatedPointsCounter } from "@/src/components/animations/AnimatedPointsCounter";
import { FocusHistorySheet } from "@/src/components/FocusHistorySheet";
import { useFocusStore } from "@/src/state/useFocusStore";
import { useTodoStore } from "@/src/state/useTodoStore";
import { useFaceDownDetection } from "@/src/hooks/useFaceDownDetection";
import { supabase } from "@/src/services/supabase";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

type ScreenPhase = "setup" | "active" | "celebration" | "points";

export default function FocusScreen() {
  const {
    sessionStatus,
    selectedTodoIds,
    selectedDuration,
    remainingSeconds,
    faceDownEnabled,
    pauseCount,
    interruptionCount,
    lastCompletedSession,
    setSelectedDuration,
    toggleTodoSelection,
    setSelectedTodoIds,
    setFaceDownEnabled,
    startSession,
    pauseSession,
    resumeSession,
    tick,
    completeSession,
    abandonSession,
    resetSession,
  } = useFocusStore();

  const todos = useTodoStore((s) => s.todos);
  const activeTodos = todos.filter((t) => t.deletedAt == null && !t.isCompleted);

  const [phase, setPhase] = useState<ScreenPhase>("setup");
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [focusStreak, setFocusStreak] = useState(0);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const insets = useSafeAreaInsets();

  const faceDown = useFaceDownDetection(
    faceDownEnabled,
    sessionStatus === "active" || sessionStatus === "paused",
  );

  useEffect(() => {
    if (sessionStatus === "active") {
      intervalRef.current = setInterval(tick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionStatus, tick]);

  useEffect(() => {
    if (remainingSeconds <= 0 && sessionStatus === "active") {
      handleSessionComplete();
    }
  }, [remainingSeconds, sessionStatus]);

  useEffect(() => {
    if (faceDown.isInterrupted && sessionStatus === "active") {
      useFocusStore.getState().interruptSession();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      faceDown.resetInterruption();
    }
  }, [faceDown.isInterrupted, sessionStatus]);

  const handleStart = useCallback(async () => {
    if (selectedTodoIds.length === 0 && activeTodos.length > 0) {
      Alert.alert("Görev Seç", "En az bir görev seçmelisin.");
      return;
    }

    const sessionId = `focus_${Date.now()}`;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from("focus_sessions").insert({
          id: sessionId,
          user_id: session.user.id,
          todo_ids: selectedTodoIds,
          duration_minutes: selectedDuration,
          face_down_enabled: faceDownEnabled,
          status: "active",
        });
      }
    } catch {}

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startSession(sessionId);
    setPhase("active");
  }, [selectedTodoIds, selectedDuration, faceDownEnabled, activeTodos.length, startSession]);

  const handleSessionComplete = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const state = useFocusStore.getState();
    const actualSeconds = selectedDuration * 60 - remainingSeconds;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.functions.invoke("complete-focus-session", {
          body: {
            sessionId: state.currentSessionId,
            status: "completed",
            actualDurationSeconds: actualSeconds,
            pauseCount: state.pauseCount,
            totalPauseSeconds: state.totalPauseDuration,
            interruptionCount: state.interruptionCount,
            faceDownEnabled: state.faceDownEnabled,
            todoIds: state.selectedTodoIds,
            durationMinutes: state.selectedDuration,
          },
        });

        const points = data?.pointsAwarded ?? 0;
        setEarnedPoints(points);
        setTotalPoints(data?.totalPoints ?? 0);
        setFocusStreak(data?.focusStreak ?? 0);
        completeSession(points);
      } else {
        completeSession(0);
      }
    } catch {
      completeSession(0);
    }

    setPhase("celebration");
  }, [selectedDuration, remainingSeconds, completeSession]);

  const handleToggle = useCallback(() => {
    if (sessionStatus === "active") {
      if (pauseCount >= 2) {
        Alert.alert("Mola Hakkı Doldu", "En fazla 2 mola verebilirsin.");
        return;
      }
      pauseSession();
    } else if (sessionStatus === "paused") {
      resumeSession();
    }
  }, [sessionStatus, pauseCount, pauseSession, resumeSession]);

  const handleAbandon = useCallback(() => {
    Alert.alert(
      "Oturumu Bitir",
      "Oturumu erken bitirmek istediğine emin misin?",
      [
        { text: "Devam Et", style: "cancel" },
        {
          text: "Bitir",
          style: "destructive",
          onPress: async () => {
            abandonSession();
            setPhase("setup");
            try {
              const state = useFocusStore.getState();
              await supabase.functions.invoke("complete-focus-session", {
                body: {
                  sessionId: state.currentSessionId,
                  status: "abandoned",
                  actualDurationSeconds: selectedDuration * 60 - remainingSeconds,
                  pauseCount: state.pauseCount,
                  totalPauseSeconds: state.totalPauseDuration,
                  interruptionCount: state.interruptionCount,
                  faceDownEnabled: state.faceDownEnabled,
                  todoIds: state.selectedTodoIds,
                  durationMinutes: state.selectedDuration,
                },
              });
            } catch {}
            resetSession();
          },
        },
      ],
    );
  }, [abandonSession, resetSession, selectedDuration, remainingSeconds]);

  const handleSelectAll = useCallback(() => {
    setSelectedTodoIds(activeTodos.map((t) => t.id));
  }, [activeTodos, setSelectedTodoIds]);

  const handleReturnHome = useCallback(() => {
    resetSession();
    setPhase("setup");
    setEarnedPoints(0);
  }, [resetSession]);

  const totalSeconds = selectedDuration * 60;

  if (phase === "celebration") {
    return (
      <SafeAreaView edges={["top"]} style={styles.darkScreen}>
        <StatusBar style="light" />
        <View style={styles.celebrationContainer}>
          <Animated.View entering={FadeInUp.delay(200).duration(600).springify()}>
            <Trophy size={64} color={semantic.accent} weight="fill" />
          </Animated.View>
          <Animated.Text
            entering={FadeInUp.delay(500).duration(500)}
            style={styles.celebrationTitle}
          >
            Tebrikler!
          </Animated.Text>
          <Animated.Text
            entering={FadeInUp.delay(700).duration(500)}
            style={styles.celebrationSubtitle}
          >
            {selectedDuration} dakikalık odak oturumunu tamamladın
          </Animated.Text>
          {focusStreak > 1 && (
            <Animated.View entering={FadeInUp.delay(900).duration(500)} style={styles.streakBadge}>
              <Lightning size={16} color="#C4962A" weight="fill" />
              <Text style={styles.streakText}>{focusStreak} günlük seri!</Text>
            </Animated.View>
          )}
          <Animated.View entering={FadeInUp.delay(1100).duration(500)}>
            <TouchableOpacity
              style={styles.celebrationCTA}
              onPress={() => setPhase("points")}
              activeOpacity={0.88}
              accessibilityRole="button"
            >
              <Text style={styles.celebrationCTAText}>Puanlarını Gör</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === "points") {
    return (
      <SafeAreaView edges={["top"]} style={styles.darkScreen}>
        <StatusBar style="light" />
        <View style={styles.pointsContainer}>
          <Animated.View entering={FadeIn.delay(200).duration(400)}>
            <AnimatedPointsCounter
              targetPoints={earnedPoints}
              duration={2500}
              hapticsEnabled
            />
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(1200).duration(500)} style={styles.pointsBreakdown}>
            <Text style={styles.breakdownTitle}>Toplam Puanın</Text>
            <Text style={styles.breakdownValue}>{totalPoints}</Text>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(2000).duration(500)}>
            <TouchableOpacity
              style={styles.returnCTA}
              onPress={handleReturnHome}
              activeOpacity={0.88}
              accessibilityRole="button"
            >
              <Text style={styles.returnCTAText}>Ana Sayfaya Dön</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === "active") {
    const isBlackout = faceDownEnabled && faceDown.isFaceDown;
    const selectedTodo = todos.find((t) => selectedTodoIds.includes(t.id));
    const elapsedSeconds = totalSeconds - remainingSeconds;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    if (isBlackout) {
      return (
        <View style={styles.blackoutContainer}>
          <StatusBar style="light" hidden />
        </View>
      );
    }

    return (
      <View style={styles.immersiveRoot}>
        <StatusBar style="light" hidden />

        {/* Warm dark gradient background */}
        <LinearGradient
          colors={["#0D0B0A", "#141210", "#0D0B0A"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Subtle radial ambient behind timer */}
        <Animated.View
          entering={FadeIn.delay(200).duration(800)}
          style={styles.ambientGlow}
        />

        {/* ── Top context bar ── */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500).springify().damping(22)}
          style={[styles.sessionTopBar, { paddingTop: Math.max(insets.top + 12, 52) }]}
        >
          <View style={styles.sessionBadge}>
            <View style={styles.sessionDot} />
            <Text style={styles.sessionBadgeText}>Focus Seansı</Text>
          </View>

          {selectedTodo && (
            <Text style={styles.sessionTaskTitle} numberOfLines={1}>
              {selectedTodo.title}
            </Text>
          )}

          <View style={styles.sessionMetaRow}>
            <Text style={styles.sessionMetaText}>{selectedDuration} dakika</Text>
            {faceDownEnabled && (
              <>
                <View style={styles.sessionMetaDot} />
                <Text style={styles.sessionMetaText}>Yüz aşağı aktif</Text>
              </>
            )}
            {pauseCount > 0 && (
              <>
                <View style={styles.sessionMetaDot} />
                <Text style={styles.sessionMetaText}>Mola {pauseCount}/2</Text>
              </>
            )}
          </View>
        </Animated.View>

        {/* ── Timer hero ── */}
        <View style={styles.timerHeroWrap}>
          <Animated.View entering={FadeIn.delay(160).duration(600)}>
            <CircularTimer
              remainingSeconds={remainingSeconds}
              totalSeconds={totalSeconds}
              size={286}
              strokeWidth={5}
              variant="dark"
            />
          </Animated.View>

          {sessionStatus === "paused" && (
            <Animated.Text
              entering={FadeIn.duration(200)}
              style={styles.pausedPill}
            >
              Duraklatıldı
            </Animated.Text>
          )}

          {elapsedMinutes > 0 && sessionStatus === "active" && (
            <Animated.Text entering={FadeIn.duration(300)} style={styles.elapsedHint}>
              {elapsedMinutes} dk geçti
            </Animated.Text>
          )}
        </View>

        {/* ── Controls ── */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500).springify().damping(22)}
          style={[styles.controlsArea, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
        >
          {/* Abandon */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={handleAbandon}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Oturumu sonlandır"
          >
            <X size={20} color="rgba(255,255,255,0.55)" weight="bold" />
          </TouchableOpacity>

          {/* Main: pause / resume */}
          <TouchableOpacity
            style={styles.mainControlBtn}
            onPress={handleToggle}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={sessionStatus === "active" ? "Duraklat" : "Devam et"}
            testID="btn-toggle-session"
          >
            {sessionStatus === "active" ? (
              <Pause size={30} color="#111111" weight="fill" />
            ) : (
              <Play size={30} color="#111111" weight="fill" />
            )}
          </TouchableOpacity>

          {/* Restart (placeholder spacer if no action needed) */}
          <View style={styles.controlBtn} />
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ── */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.headerBlock}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Focus</Text>
              <Text style={styles.subtitle}>Derin odaklanma zamanı</Text>
            </View>
            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => setIsHistoryVisible(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Timer geçmişini aç"
            >
              <ClockCounterClockwise size={18} color="rgba(17,17,17,0.6)" weight="regular" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Main card ── */}
        <Animated.View
          entering={FadeInUp.delay(60).duration(340).springify().damping(22).stiffness(200)}
          style={[styles.sheet, shadow.card]}
        >
          <TodoSelector
            todos={activeTodos}
            selectedIds={selectedTodoIds}
            onToggle={toggleTodoSelection}
            onSelectAll={handleSelectAll}
          />

          <View style={styles.divider} />

          <DurationPicker
            selectedDuration={selectedDuration}
            onSelect={setSelectedDuration}
          />

          <View style={styles.divider} />

          <FaceDownToggle
            enabled={faceDownEnabled}
            onToggle={setFaceDownEnabled}
            isAvailable={faceDown.isAvailable}
          />
        </Animated.View>

        {/* ── CTA ── */}
        <Animated.View
          entering={FadeInUp.delay(120).duration(340).springify().damping(22).stiffness(200)}
        >
          <TouchableOpacity
            style={[
              styles.startCTA,
              selectedTodoIds.length === 0 && activeTodos.length > 0 && styles.startCTADisabled,
            ]}
            onPress={handleStart}
            activeOpacity={0.84}
            accessibilityRole="button"
            accessibilityLabel="Odak oturumunu başlat"
            testID="btn-start-session"
          >
            <Play size={16} color="#FFFFFF" weight="fill" />
            <Text style={styles.startCTAText}>Seansı Başlat</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <FocusHistorySheet
        visible={isHistoryVisible}
        onClose={() => setIsHistoryVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── Setup screen ──────────────────────────────────────────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: semantic.appBackground,
  },
  darkScreen: {
    flex: 1,
    backgroundColor: "#111111",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  headerBlock: {
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(17,17,17,0.42)",
    fontWeight: "400",
    marginTop: 5,
  },
  historyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  sheet: {
    borderRadius: 24,
    backgroundColor: "#FAFAF8",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.055)",
    marginHorizontal: -4,
  },
  startCTA: {
    backgroundColor: "#111111",
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.xs,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  startCTADisabled: {
    opacity: 0.38,
    shadowOpacity: 0,
  },
  startCTAText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.1,
  },

  // ── Active / immersive timer ──────────────────────────────────────────────
  immersiveRoot: {
    flex: 1,
    backgroundColor: "#0D0B0A",
  },
  blackoutContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  ambientGlow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(255,255,255,0.025)",
    alignSelf: "center",
    top: "50%",
    marginTop: -160,
  },
  sessionTopBar: {
    paddingHorizontal: 28,
    gap: 5,
  },
  sessionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 4,
  },
  sessionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  sessionBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sessionTaskTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
    letterSpacing: -0.3,
  },
  sessionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },
  sessionMetaText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "400",
  },
  sessionMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  timerHeroWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  pausedPill: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.3,
  },
  elapsedHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.25)",
    fontWeight: "400",
  },
  controlsArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 36,
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  mainControlBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(255,255,255,0.3)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },

  // ── Celebration ───────────────────────────────────────────────────────────
  celebrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    gap: 20,
  },
  celebrationTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  celebrationSubtitle: {
    fontSize: 17,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
    textAlign: "center",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(196,150,42,0.15)",
    marginTop: spacing.xs,
  },
  streakText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#C4962A",
  },
  celebrationCTA: {
    backgroundColor: semantic.accent,
    borderRadius: radius.xl,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginTop: spacing.lg,
  },
  celebrationCTAText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  pointsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    gap: 40,
  },
  pointsBreakdown: {
    alignItems: "center",
    gap: 4,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  breakdownValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  returnCTA: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: radius.xl,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  returnCTAText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
