import { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type CircularTimerVariant = "light" | "dark";

type CircularTimerProps = {
  remainingSeconds: number;
  totalSeconds: number;
  size?: number;
  strokeWidth?: number;
  variant?: CircularTimerVariant;
};

const THEME = {
  light: {
    track: "rgba(0,0,0,0.07)",
    progress: "#111111",
    text: "#111111",
    glowId: null,
  },
  dark: {
    track: "rgba(255,255,255,0.10)",
    progress: "rgba(255,255,255,0.92)",
    text: "#FFFFFF",
    glowId: "glowGrad",
  },
} as const;

export const CircularTimer = ({
  remainingSeconds,
  totalSeconds,
  size = 240,
  strokeWidth = 6,
  variant = "light",
}: CircularTimerProps) => {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const center = size / 2;
  const theme = THEME[variant];

  const progress = useSharedValue(1);

  useEffect(() => {
    const fraction = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
    progress.value = withTiming(fraction, {
      duration: 800,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [remainingSeconds, totalSeconds, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const fontSize = size >= 260 ? 62 : size >= 200 ? 52 : 40;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {variant === "dark" && (
          <Defs>
            <RadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
              <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </RadialGradient>
          </Defs>
        )}

        {/* Ambient glow fill for dark variant */}
        {variant === "dark" && (
          <Circle cx={center} cy={center} r={r - strokeWidth} fill="url(#glowGrad)" />
        )}

        {/* Track ring */}
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={theme.track}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress ring */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={r}
          stroke={theme.progress}
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
        <Text style={[styles.timeText, { fontSize, color: theme.text }]}>
          {timeDisplay}
        </Text>
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
    fontWeight: "700",
    letterSpacing: -2,
    fontVariant: ["tabular-nums"],
  },
});
