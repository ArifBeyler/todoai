import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { radius, semantic, spacing } from "@/src/ui/tokens";

const PRESETS = [15, 25, 45, 60, 90] as const;
type Preset = (typeof PRESETS)[number];

type DurationPickerProps = {
  selectedDuration: number;
  onSelect: (duration: number) => void;
};

const DurationChip = ({
  value,
  isSelected,
  onPress,
}: {
  value: number;
  isSelected: boolean;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[styles.chip, isSelected && styles.chipSelected]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${value} dakika`}
      >
        <Text style={[styles.chipValue, isSelected && styles.chipValueSelected]}>
          {value}
        </Text>
        <Text style={[styles.chipUnit, isSelected && styles.chipUnitSelected]}>dk</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const DurationPicker = ({ selectedDuration, onSelect }: DurationPickerProps) => (
  <View style={styles.container}>
    <Text style={styles.title}>Süre</Text>
    <View style={styles.row}>
      {PRESETS.map((preset) => (
        <DurationChip
          key={preset}
          value={preset}
          isSelected={selectedDuration === preset}
          onPress={() => onSelect(preset)}
        />
      ))}
    </View>
    <Text style={styles.selectedDisplay}>
      {selectedDuration} <Text style={styles.selectedUnit}>dakika</Text>
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8A7A70",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    alignSelf: "flex-start",
    paddingLeft: 4,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  chip: {
    alignItems: "center",
    justifyContent: "center",
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#F2EEE8",
    gap: 1,
  },
  chipSelected: {
    backgroundColor: "#111111",
  },
  chipValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3A2E28",
  },
  chipValueSelected: {
    color: "#FFFFFF",
  },
  chipUnit: {
    fontSize: 10,
    fontWeight: "600",
    color: "#8A7A70",
  },
  chipUnitSelected: {
    color: "rgba(255,255,255,0.6)",
  },
  selectedDisplay: {
    fontSize: 42,
    fontWeight: "800",
    color: "#3A2E28",
    marginTop: spacing.xs,
  },
  selectedUnit: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8A7A70",
  },
});
