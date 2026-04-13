import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type OnboardingProgressProps = {
  current: number;
  total: number;
};

export const OnboardingProgress = ({
  current,
  total,
}: OnboardingProgressProps) => {
  const targetRatio = Math.min(current / total, 1);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(targetRatio, {
      duration: 560,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetRatio]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.track}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(0, 0, 0, 0.07)",
    overflow: "hidden",
    marginBottom: 20,
  },
  fill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#111111",
  },
});
