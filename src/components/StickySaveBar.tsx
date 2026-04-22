import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, spacing } from "@/src/ui/tokens";
import { BounceTouchable, LAYER } from "./composerShared";

type StickySaveBarProps = {
  enabled: boolean;
  onSave: () => void;
  testID?: string;
};

export const StickySaveBar = ({ enabled, onSave, testID }: StickySaveBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["rgba(242, 242, 240, 0)", "rgba(242, 242, 240, 0.92)", LAYER.bg]}
        style={styles.fade}
        pointerEvents="none"
      />
      <View
        style={[
          styles.inner,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <BounceTouchable
          style={[styles.button, !enabled && styles.buttonDisabled]}
          onPress={onSave}
          disabled={!enabled}
          accessibilityRole="button"
          accessibilityLabel="Kaydet"
          testID={testID}
        >
          <Text style={styles.buttonText}>Kaydet</Text>
        </BounceTouchable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  fade: {
    height: 32,
  },
  inner: {
    backgroundColor: LAYER.bg,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  button: {
    borderRadius: radius.pill,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    shadowColor: "rgba(0, 0, 0, 0.18)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: "rgba(17, 17, 17, 0.15)",
    shadowOpacity: 0,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
});
