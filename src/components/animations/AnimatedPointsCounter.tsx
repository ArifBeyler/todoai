import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { semantic, spacing } from "@/src/ui/tokens";

type AnimatedPointsCounterProps = {
  targetPoints: number;
  duration?: number;
  hapticsEnabled?: boolean;
  onComplete?: () => void;
  label?: string;
};

export const AnimatedPointsCounter = ({
  targetPoints,
  duration = 2000,
  hapticsEnabled = true,
  onComplete,
  label = "puan",
}: AnimatedPointsCounterProps) => {
  const displayValue = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const lastHapticAt = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });

    displayValue.value = withTiming(targetPoints, {
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }, (finished) => {
      if (finished && onComplete) {
        runOnJS(onComplete)();
      }
    });
  }, [targetPoints, duration, onComplete, displayValue, scale, opacity]);

  useEffect(() => {
    if (!hapticsEnabled) return;

    const interval = setInterval(() => {
      const current = Math.round(displayValue.value);
      const lastHaptic = lastHapticAt.value;
      if (current - lastHaptic >= 10 && current < targetPoints) {
        lastHapticAt.value = current;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [targetPoints, hapticsEnabled, displayValue, lastHapticAt]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <AnimatedDigits sharedValue={displayValue} />
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
};

const AnimatedDigits = ({ sharedValue }: { sharedValue: { value: number } }) => {
  const [displayText, setDisplayText] = useState("0");

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayText(`+${Math.round(sharedValue.value)}`);
    }, 16);
    return () => clearInterval(interval);
  }, [sharedValue]);

  return <Text style={styles.value}>{displayText}</Text>;
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.xs,
  },
  value: {
    fontSize: 72,
    fontWeight: "800",
    color: semantic.accent,
    letterSpacing: -2,
    lineHeight: 80,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8A7A70",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});
