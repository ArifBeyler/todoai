import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pause, Play, ArrowCounterClockwise, Lightning, Coffee, Moon } from "phosphor-react-native";
import { CircularTimer } from "@/src/components/CircularTimer";
import { useFocusStore } from "@/src/state/useFocusStore";
import type { FocusMode } from "@/src/state/useFocusStore";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

const QUICK_DURATIONS = [15, 25, 45, 60] as const;

const MODE_META: Record<FocusMode, { label: string; icon: typeof Lightning; color: string }> = {
  focus: { label: "Odak", icon: Lightning, color: "#3A2E28" },
  shortBreak: { label: "Kısa Mola", icon: Coffee, color: "#76A28A" },
  longBreak: { label: "Uzun Mola", icon: Moon, color: "#C28B58" },
};

export default function FocusScreen() {
  const {
    mode,
    isRunning,
    selectedDuration,
    remainingSeconds,
    sessionsCompleted,
    totalFocusMinutesToday,
    todaySessions,
    setMode,
    setSelectedDuration,
    start,
    pause,
    reset,
    tick,
  } = useFocusStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  const totalSeconds = selectedDuration * 60;
  const currentModeMeta = MODE_META[mode];

  const handleToggle = () => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar hidden />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Focus</Text>
          <Text style={styles.subtitle}>Derin odaklanma zamanı</Text>
        </View>

        <View style={[styles.sheet, shadow.soft]}>
          {/* Mode selector */}
          <View style={styles.modeRow}>
            {(Object.keys(MODE_META) as FocusMode[]).map((m) => {
              const meta = MODE_META[m];
              const isActive = mode === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeChip, isActive && styles.modeChipActive]}
                  onPress={() => setMode(m)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={meta.label}
                >
                  <Text style={[styles.modeChipText, isActive && styles.modeChipTextActive]}>
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Timer */}
          <View style={styles.timerSection}>
            <CircularTimer
              remainingSeconds={remainingSeconds}
              totalSeconds={totalSeconds}
              size={240}
              strokeWidth={10}
            />
          </View>

          {/* Mode label */}
          <View style={styles.modeLabelRow}>
            <currentModeMeta.icon size={18} color={currentModeMeta.color} weight="fill" />
            <Text style={[styles.modeLabelText, { color: currentModeMeta.color }]}>
              {currentModeMeta.label}
            </Text>
            <Text style={styles.sessionBadge}>
              Seans {sessionsCompleted + 1}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={styles.secondaryControl}
              onPress={reset}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Sıfırla"
            >
              <ArrowCounterClockwise size={22} color="#7C6C62" weight="bold" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryControl, shadow.soft]}
              onPress={handleToggle}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={isRunning ? "Duraklat" : "Başlat"}
            >
              {isRunning ? (
                <Pause size={28} color="#FFFFFF" weight="fill" />
              ) : (
                <Play size={28} color="#FFFFFF" weight="fill" />
              )}
            </TouchableOpacity>

            <View style={styles.secondaryControl} />
          </View>

          {/* Quick duration chips (only in focus mode when not running) */}
          {mode === "focus" && !isRunning && (
            <>
              <Text style={styles.quickLabel}>Hızlı Seçim</Text>
              <View style={styles.quickRow}>
                {QUICK_DURATIONS.map((d) => {
                  const isSelected = selectedDuration === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.quickChip, isSelected && styles.quickChipSelected]}
                      onPress={() => setSelectedDuration(d)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`${d} dakika`}
                    >
                      <Text style={[styles.quickChipText, isSelected && styles.quickChipTextSelected]}>
                        {d} dk
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Daily summary */}
          <View style={styles.summaryWrap}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{todaySessions.length}</Text>
              <Text style={styles.summaryLabel}>Seans</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{totalFocusMinutesToday}</Text>
              <Text style={styles.summaryLabel}>Dakika</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{sessionsCompleted}</Text>
              <Text style={styles.summaryLabel}>Tamamlanan</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semantic.appBackground,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: 14,
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "700",
    color: "#3A2E28",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#7C6C62",
  },
  sheet: {
    marginTop: spacing.sm,
    marginHorizontal: 14,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: "#FDFAF6",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modeRow: {
    flexDirection: "row",
    borderRadius: 18,
    backgroundColor: "#F1EEE9",
    padding: 3,
    gap: 3,
    marginBottom: spacing.xl,
  },
  modeChip: {
    flex: 1,
    borderRadius: 15,
    paddingVertical: 9,
    alignItems: "center",
  },
  modeChipActive: {
    backgroundColor: "#202126",
    shadowColor: "rgba(0,0,0,0.12)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  modeChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#7A6A5F",
  },
  modeChipTextActive: {
    color: "#FDFAF6",
    fontWeight: "600",
  },
  timerSection: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  modeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: spacing.lg,
  },
  modeLabelText: {
    fontSize: 15,
    fontWeight: "600",
  },
  sessionBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8A7A70",
    backgroundColor: "#F2EEE8",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: "hidden",
    marginLeft: 4,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginBottom: spacing.xl,
  },
  primaryControl: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryControl: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F2EEE8",
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7C6C62",
    marginBottom: 8,
  },
  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.xl,
  },
  quickChip: {
    flex: 1,
    borderRadius: radius.pill,
    backgroundColor: "#F2EEE8",
    paddingVertical: 10,
    alignItems: "center",
  },
  quickChipSelected: {
    backgroundColor: "#202126",
  },
  quickChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5C4E46",
  },
  quickChipTextSelected: {
    color: "#FDFAF6",
  },
  summaryWrap: {
    flexDirection: "row",
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#F2EEE8",
    paddingVertical: 10,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3A2E28",
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: 11,
    color: "#7C6C62",
    fontWeight: "500",
  },
});
