import { StyleSheet, Switch, Text, View } from "react-native";
import { Bell, BellSlash } from "phosphor-react-native";
import { spacing } from "@/src/ui/tokens";

type ReminderToggleRowProps = {
  enabled: boolean;
  onToggle: (value: boolean) => void;
};

export const ReminderToggleRow = ({ enabled, onToggle }: ReminderToggleRowProps) => {
  const Icon = enabled ? Bell : BellSlash;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={[styles.iconWrap, enabled && styles.iconWrapActive]}>
          <Icon size={17} color={enabled ? "#3A2E28" : "#8A7A70"} weight={enabled ? "fill" : "regular"} />
        </View>
        <Text style={styles.label}>Hatırlatma</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: "#E5E3DF", true: "#3A2E28" }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E5E3DF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F2EEE8",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: "#EDE5D8",
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    color: "#3A2E28",
  },
});
