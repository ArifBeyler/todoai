import { StyleSheet, Switch, Text, View } from "react-native";
import { Bell } from "phosphor-react-native";
import { spacing } from "@/src/ui/tokens";
import {
  type CreationMode,
  type RepeatConfig,
  repeatConfigToLabel,
} from "./composerShared";

type ReminderBlockProps = {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  mode: CreationMode;
  repeatConfig: RepeatConfig;
  timeLabel: string;
};

const buildHelperText = (
  enabled: boolean,
  mode: CreationMode,
  repeatConfig: RepeatConfig,
  timeLabel: string,
): string => {
  if (!enabled) return "Hatırlatma şu an kapalı.";

  if (mode === "task") {
    return `Seçilen saatte (${timeLabel}) bir kez hatırlatma yapılır.`;
  }

  if (repeatConfig.type === "customDates" && repeatConfig.customDates.length === 0) {
    return "Tarih seçilmediği için hatırlatma yapılamaz.";
  }

  const label = repeatConfigToLabel(repeatConfig);
  if (repeatConfig.type === "customDates") {
    return `${label} tarihlerinde saat ${timeLabel}'de hatırlatılır.`;
  }

  return `${label} saat ${timeLabel}'de bildirim gönderilir.`;
};

export const ReminderBlock = ({
  enabled,
  onToggle,
  mode,
  repeatConfig,
  timeLabel,
}: ReminderBlockProps) => {
  const helperText = buildHelperText(enabled, mode, repeatConfig, timeLabel);

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Bell
            size={16}
            color={enabled ? "#111111" : "rgba(17, 17, 17, 0.35)"}
            weight={enabled ? "fill" : "regular"}
          />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.label}>Hatırlatma</Text>
          <Text style={styles.helper}>{helperText}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: "#D8D8DD", true: "#111111" }}
          thumbColor="#FFFFFF"
          accessibilityLabel="Hatırlatma anahtarı"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(17, 17, 17, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.1,
  },
  helper: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(17, 17, 17, 0.42)",
    lineHeight: 16,
  },
});
