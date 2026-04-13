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
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Play, Pause, ArrowCounterClockwise, Trophy, Lightning } from "phosphor-react-native";

import { CircularTimer } from "@/src/components/CircularTimer";
import { TodoSelector } from "@/src/components/TodoSelector";
import { DurationPicker } from "@/src/components/DurationPicker";
import { FaceDownToggle } from "@/src/components/FaceDownToggle";
import { AnimatedPointsCounter } from "@/src/components/animations/AnimatedPointsCounter";
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
  const activeTodos = todos.filter((t) => !t.isCompleted);

  const [phase, setPhase] = useState<ScreenPhase>("setup");
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [focusStreak, setFocusStreak] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      <SafeAreaView edges={["top"]} style={styles.darkSafeArea}>
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
      <SafeAreaView edges={["top"]} style={styles.darkSafeArea}>
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
    const isDark = faceDownEnabled && faceDown.isFaceDown;

    return (
      <SafeAreaView edges={["top"]} style={styles.darkSafeArea}>
        <StatusBar style="light" />
        <View style={[styles.activeContainer, isDark && styles.blackoutContainer]}>
          {!isDark && (
            <>
              <Animated.View entering={FadeIn.duration(300)} style={styles.timerWrap}>
                <CircularTimer
                  remainingSeconds={remainingSeconds}
                  totalSeconds={totalSeconds}
                  size={240}
                  strokeWidth={8}
                />
                {sessionStatus === "paused" && (
                  <Text style={styles.pausedLabel}>Duraklatıldı</Text>
                )}
              </Animated.View>

              <View style={styles.activeTodoList}>
                {selectedTodoIds.length > 0 && (
                  <Text style={styles.activeTodoLabel}>
                    {selectedTodoIds.length} görev · {selectedDuration} dakika
                  </Text>
                )}
                {pauseCount > 0 && (
                  <Text style={styles.pauseInfo}>Mola: {pauseCount}/2</Text>
                )}
              </View>

              <View style={styles.controlRow}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleAbandon}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Oturumu bitir"
                >
                  <ArrowCounterClockwise size={24} color="#FFFFFF" weight="regular" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mainControlButton}
                  onPress={handleToggle}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel={sessionStatus === "active" ? "Duraklat" : "Devam et"}
                >
                  {sessionStatus === "active" ? (
                    <Pause size={32} color="#111111" weight="fill" />
                  ) : (
                    <Play size={32} color="#111111" weight="fill" />
                  )}
                </TouchableOpacity>

                <View style={styles.controlButton} />
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeIn.duration(300)}>
          <Text style={styles.title}>Focus</Text>
          <Text style={styles.subtitle}>Derin odaklanma zamanı</Text>
        </Animated.View>

        <View style={[styles.sheet, shadow.soft]}>
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
        </View>

        <TouchableOpacity
          style={[
            styles.startCTA,
            selectedTodoIds.length === 0 && activeTodos.length > 0 && styles.startCTADisabled,
          ]}
          onPress={handleStart}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Odak oturumunu başlat"
        >
          <Text style={styles.startCTAText}>Başla</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semantic.appBackground,
  },
  darkSafeArea: {
    flex: 1,
    backgroundColor: "#111111",
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 120,
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "700",
    color: "#3A2E28",
    letterSpacing: -0.5,
    paddingTop: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: "#8A7A70",
    fontWeight: "500",
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  sheet: {
    borderRadius: radius.xl,
    backgroundColor: "#FDFAF6",
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: "#F2EEE8",
  },
  startCTA: {
    backgroundColor: semantic.accent,
    borderRadius: radius.xl,
    paddingVertical: 18,
    alignItems: "center",
  },
  startCTADisabled: {
    opacity: 0.5,
  },
  startCTAText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  activeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 40,
  },
  blackoutContainer: {
    backgroundColor: "#000000",
  },
  timerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerCenter: {
    position: "absolute",
    alignItems: "center",
  },
  timerText: {
    fontSize: 56,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -2,
  },
  pausedLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
    marginTop: 4,
  },
  activeTodoList: {
    alignItems: "center",
    gap: 4,
  },
  activeTodoLabel: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  pauseInfo: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 30,
  },
  controlButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  mainControlButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
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
