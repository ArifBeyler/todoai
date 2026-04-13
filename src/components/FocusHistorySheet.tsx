import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { CheckCircle, Clock, Fire, X } from "phosphor-react-native";
import { useFocusStore } from "@/src/state/useFocusStore";
import { radius, shadow, spacing } from "@/src/ui/tokens";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
};

const formatDuration = (minutes: number) => `${minutes} dk`;

export const FocusHistorySheet = ({ visible, onClose }: Props) => {
  const insets = useSafeAreaInsets();
  const { sessionsCompleted, totalFocusMinutesToday, todaySessions } = useFocusStore();

  const completedSessions = todaySessions.filter((s) => s.status === "completed");
  const streak = sessionsCompleted; // simple count as streak proxy

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <Animated.View
        entering={FadeInUp.duration(340).springify().damping(24).stiffness(220)}
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + spacing.md, 28) }]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Bugün</Text>
            <Text style={styles.title}>Focus Geçmişi</Text>
          </View>
          <Pressable
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
          >
            <X size={16} color="rgba(17,17,17,0.5)" weight="bold" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Stat row */}
          <Animated.View entering={FadeIn.delay(60).duration(300)} style={styles.statsRow}>
            <View style={[styles.statCard, shadow.card]}>
              <View style={styles.statIconWrap}>
                <CheckCircle size={16} color="#111111" weight="fill" />
              </View>
              <Text style={styles.statValue}>{sessionsCompleted}</Text>
              <Text style={styles.statLabel}>Tamamlanan</Text>
            </View>

            <View style={[styles.statCard, shadow.card]}>
              <View style={styles.statIconWrap}>
                <Clock size={16} color="#111111" weight="fill" />
              </View>
              <Text style={styles.statValue}>{totalFocusMinutesToday}</Text>
              <Text style={styles.statLabel}>Dakika</Text>
            </View>

            <View style={[styles.statCard, shadow.card]}>
              <View style={styles.statIconWrap}>
                <Fire size={16} color="#111111" weight="fill" />
              </View>
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>Seri</Text>
            </View>
          </Animated.View>

          {/* Session list */}
          {completedSessions.length === 0 ? (
            <Animated.View entering={FadeIn.delay(120).duration(300)} style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Clock size={20} color="rgba(17,17,17,0.25)" weight="regular" />
              </View>
              <Text style={styles.emptyText}>Henüz tamamlanan oturum yok</Text>
              <Text style={styles.emptyHint}>İlk focus seansını başlat!</Text>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.delay(120).duration(300)} style={styles.sessionList}>
              <Text style={styles.sectionLabel}>Oturumlar</Text>
              {[...completedSessions].reverse().map((session, i) => (
                <View key={session.id} style={styles.sessionRow}>
                  <View style={styles.sessionDot} />
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionDuration}>
                      {formatDuration(session.duration)}
                    </Text>
                    {session.startedAt && (
                      <Text style={styles.sessionTime}>
                        {formatTime(session.startedAt)}
                        {session.completedAt ? ` – ${formatTime(session.completedAt)}` : ""}
                      </Text>
                    )}
                  </View>
                  {session.pointsAwarded > 0 && (
                    <Text style={styles.sessionPoints}>+{session.pointsAwarded}</Text>
                  )}
                </View>
              ))}
            </Animated.View>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

const SHEET_BG = "#FAFAF8";
const BORDER = "rgba(0,0,0,0.05)";
const TEXT_MUTED = "rgba(17,17,17,0.45)";

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: BORDER,
    maxHeight: "78%",
  },
  handle: {
    alignSelf: "center",
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.12)",
    marginBottom: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111111",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 6,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(17,17,17,0.52)",
  },
  emptyHint: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  sessionList: {
    gap: 0,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  sessionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#111111",
  },
  sessionInfo: {
    flex: 1,
    gap: 2,
  },
  sessionDuration: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },
  sessionTime: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: "400",
  },
  sessionPoints: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(17,17,17,0.55)",
  },
});
