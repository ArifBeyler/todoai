import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { semantic } from "@/src/ui/tokens";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type SpinningLoaderProps = {
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  containerSize?: number;
  borderRadius?: number;
};

export const SpinningLoader = ({
  size = 36,
  strokeWidth = 3,
  color = semantic.textSecondary,
  backgroundColor = "#E8F0FE",
  containerSize = 56,
  borderRadius = 14,
}: SpinningLoaderProps) => {
  const rotation = useSharedValue(0);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * 0.7,
  }));

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius,
          backgroundColor,
        },
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Yükleniyor"
    >
      <Animated.View style={animatedStyle}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={`${color}20`}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference}`}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
