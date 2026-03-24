import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

type Segment = {
  key: string;
  label: string;
};

type SegmentedControlProps = {
  segments: Segment[];
  activeKey: string;
  onSelect: (key: string) => void;
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const SegmentedControl = ({ segments, activeKey, onSelect }: SegmentedControlProps) => {
  return (
    <View style={styles.container}>
      {segments.map((segment) => {
        const isActive = segment.key === activeKey;
        return (
          <SegmentItem
            key={segment.key}
            label={segment.label}
            isActive={isActive}
            onPress={() => onSelect(segment.key)}
          />
        );
      })}
    </View>
  );
};

const SegmentItem = ({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(isActive ? "#111111" : "transparent", {
      duration: 250,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }),
  }));

  return (
    <AnimatedTouchable
      style={[styles.segment, animatedStyle]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
        {label}
      </Text>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    backgroundColor: "#EDEDEB",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
    padding: 3,
    flexDirection: "row",
    gap: 3,
  },
  segment: {
    flex: 1,
    borderRadius: 15,
    paddingVertical: 9,
    alignItems: "center",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(17, 17, 17, 0.55)",
  },
  segmentTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
