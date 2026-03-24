import { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type CircularTimerProps = {
  remainingSeconds: number;
  totalSeconds: number;
  size?: number;
  strokeWidth?: number;
};

export const CircularTimer = ({
  remainingSeconds,
  totalSeconds,
  size = 240,
  strokeWidth = 10,
}: CircularTimerProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const progress = useSharedValue(1);

  useEffect(() => {
    const fraction = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
    progress.value = withTiming(fraction, {
      duration: 400,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [remainingSeconds, totalSeconds, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#EDE5D8"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="#3A2E28"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={styles.timeOverlay}>
        <Text style={styles.timeText}>{timeDisplay}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  timeOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    fontSize: 52,
    fontWeight: "700",
    color: "#3A2E28",
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },
});
