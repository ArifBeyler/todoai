import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { spacing } from "@/src/ui/tokens";

const PRESETS = [15, 25, 45, 60, 90] as const;
type Preset = (typeof PRESETS)[number];

type DurationPickerProps = {
  selectedDuration: number;
  onSelect: (duration: number) => void;
};

// ─── Chip ────────────────────────────────────────────────────────────────────

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
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
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

// ─── Animated number display ──────────────────────────────────────────────────

const SLIDE_DISTANCE = 18;
const EXIT_MS = 110;
const ENTER_SPRING = { damping: 20, stiffness: 320 } as const;

const DurationDisplay = ({ value }: { value: number }) => {
  const [displayed, setDisplayed] = useState(value);
  const prevRef = useRef(value);

  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (value === prevRef.current) return;

    // Numbers increase → slide up; decrease → slide down
    const goingUp = value > prevRef.current;
    prevRef.current = value;

    const exitY = goingUp ? -SLIDE_DISTANCE : SLIDE_DISTANCE;
    const enterY = goingUp ? SLIDE_DISTANCE : -SLIDE_DISTANCE;

    // Exit: fade + slide out
    opacity.value = withTiming(0, { duration: EXIT_MS });
    translateY.value = withTiming(exitY, { duration: EXIT_MS }, (finished) => {
      if (!finished) return;

      // Swap text while off-screen
      runOnJS(setDisplayed)(value);

      // Reset to opposite edge silently
      translateY.value = enterY;

      // Enter: spring in from opposite edge
      opacity.value = withSpring(1, ENTER_SPRING);
      translateY.value = withSpring(0, ENTER_SPRING);
    });
  }, [value]);

  return (
    <View style={styles.selectedDisplayWrap}>
      <View style={styles.selectedClip}>
        <Animated.View style={[styles.selectedRow, animStyle]}>
          <Text style={styles.selectedNumber}>{displayed}</Text>
          <Text style={styles.selectedUnit}>dakika</Text>
        </Animated.View>
      </View>
    </View>
  );
};

// ─── Picker ───────────────────────────────────────────────────────────────────

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
    <DurationDisplay value={selectedDuration} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(17,17,17,0.38)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    alignSelf: "flex-start",
    paddingLeft: 2,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  chip: {
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#EDEBE7",
    gap: 1,
  },
  chipSelected: {
    backgroundColor: "#111111",
  },
  chipValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111111",
  },
  chipValueSelected: {
    color: "#FFFFFF",
  },
  chipUnit: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(17,17,17,0.42)",
  },
  chipUnitSelected: {
    color: "rgba(255,255,255,0.55)",
  },
  selectedDisplayWrap: {
    marginTop: spacing.xs,
    alignItems: "center",
    // Fixed height prevents layout shift during animation
    height: 58,
    justifyContent: "center",
  },
  selectedClip: {
    overflow: "hidden",
    height: 58,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 7,
  },
  selectedNumber: {
    fontSize: 46,
    fontWeight: "800",
    color: "#111111",
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  selectedUnit: {
    fontSize: 20,
    fontWeight: "500",
    color: "rgba(17,17,17,0.4)",
    lineHeight: 28,
    paddingBottom: 3,
  },
});
