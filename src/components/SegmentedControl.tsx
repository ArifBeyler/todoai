import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

type Segment = {
  key: string;
  label: string;
  badge?: number;
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
            badge={segment.badge}
            onPress={() => onSelect(segment.key)}
          />
        );
      })}
    </View>
  );
};

const PulseDot = () => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.pulseDot, animatedDotStyle]} />;
};

const SegmentItem = ({
  label,
  isActive,
  badge,
  onPress,
}: {
  label: string;
  isActive: boolean;
  badge?: number;
  onPress: () => void;
}) => {
  const showDot = !isActive && (badge ?? 0) > 0;

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
      accessibilityHint={showDot ? `${badge} görev mevcut` : undefined}
    >
      <View style={styles.segmentInner}>
        <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
          {label}
        </Text>
        {showDot && <PulseDot />}
      </View>
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
  segmentInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#E8643B",
  },
});
