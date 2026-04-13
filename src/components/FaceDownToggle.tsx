import { StyleSheet, Switch, Text, View } from "react-native";
import { DeviceMobileCamera } from "phosphor-react-native";
import { radius, semantic, spacing } from "@/src/ui/tokens";

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
        <DeviceMobileCamera size={20} color="#5C4E46" weight="regular" />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>Telefonu ters çevir</Text>
        <Text style={styles.subtitle}>Odak süresince ekrana bakma</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: "#E5E3DF", true: semantic.accent }}
        thumbColor="#FFFFFF"
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
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: "#F8F7F5",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F2EEE8",
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
    color: "#3A2E28",
  },
  subtitle: {
    fontSize: 12,
    color: "#8A7A70",
    fontWeight: "500",
  },
});
