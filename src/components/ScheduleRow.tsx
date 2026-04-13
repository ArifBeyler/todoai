import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CalendarBlank, Clock } from "phosphor-react-native";
import { radius, spacing } from "@/src/ui/tokens";
import { CARD_SHADOW, LAYER } from "./composerShared";

type ScheduleRowProps = {
  dateLabel: string;
  timeLabel: string;
  onPressDate: () => void;
  onPressTime: () => void;
};

export const ScheduleRow = ({
  dateLabel,
  timeLabel,
  onPressDate,
  onPressTime,
}: ScheduleRowProps) => (
  <View style={styles.root}>
    <TouchableOpacity
      style={styles.cell}
      onPress={onPressDate}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Tarih seç"
    >
      <CalendarBlank size={15} color="rgba(17, 17, 17, 0.4)" weight="regular" />
      <View style={styles.cellText}>
        <Text style={styles.label}>Tarih</Text>
        <Text style={styles.value}>{dateLabel}</Text>
      </View>
    </TouchableOpacity>

    <View style={styles.separator} />

    <TouchableOpacity
      style={styles.cell}
      onPress={onPressTime}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Saat seç"
    >
      <Clock size={15} color="rgba(17, 17, 17, 0.4)" weight="regular" />
      <View style={styles.cellText}>
        <Text style={styles.label}>Saat</Text>
        <Text style={styles.value}>{timeLabel}</Text>
      </View>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.sm,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
    overflow: "hidden",
  },
  cell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  cellText: {
    gap: 1,
  },
  label: {
    fontSize: 11,
    color: "rgba(17, 17, 17, 0.42)",
    fontWeight: "600",
  },
  value: {
    fontSize: 15,
    color: "#111111",
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
  },
});
