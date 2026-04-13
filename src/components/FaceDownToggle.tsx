import { StyleSheet, Switch, Text, View } from "react-native";
import { DeviceMobileCamera } from "phosphor-react-native";
import { semantic, spacing } from "@/src/ui/tokens";

type FaceDownToggleProps = {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  isAvailable: boolean;
};

export const FaceDownToggle = ({
  enabled,
  onToggle,
  isAvailable,
}: FaceDownToggleProps) => {
  if (!isAvailable) return null;

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <DeviceMobileCamera size={19} color={enabled ? semantic.accent : "rgba(17,17,17,0.48)"} weight={enabled ? "fill" : "regular"} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>Telefonu ters çevir</Text>
        <Text style={styles.subtitle}>Odak süresince ekrana bakma</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: "#DEDDDA", true: semantic.accent }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#DEDDDA"
        accessibilityRole="switch"
        accessibilityLabel="Ters çevirme modu"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.035)",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(17,17,17,0.45)",
    fontWeight: "400",
  },
});
