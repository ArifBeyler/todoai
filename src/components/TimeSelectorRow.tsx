import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CalendarBlank, Clock } from "phosphor-react-native";
import { radius, spacing } from "@/src/ui/tokens";

type TimeSelectorRowProps = {
  date?: string;
  time?: string;
  onPressDate: () => void;
  onPressTime: () => void;
};

export const TimeSelectorRow = ({ date, time, onPressDate, onPressTime }: TimeSelectorRowProps) => {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.selector}
        onPress={onPressDate}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Tarih seç"
      >
        <View style={styles.iconWrap}>
          <CalendarBlank size={17} color="#5C4E46" weight="regular" />
        </View>
        <Text style={[styles.text, !date && styles.placeholder]}>
          {date ?? "Tarih seç"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.selector}
        onPress={onPressTime}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Saat seç"
      >
        <View style={styles.iconWrap}>
          <Clock size={17} color="#5C4E46" weight="regular" />
        </View>
        <Text style={[styles.text, !time && styles.placeholder]}>
          {time ?? "Saat seç"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  selector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: "#F2EEE8",
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FDFAF6",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3A2E28",
  },
  placeholder: {
    color: "#8A7A70",
  },
});
