import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { semantic } from "@/src/ui/tokens";

type AnimatedProgressBarProps = {
  progress?: number;
  duration?: number;
  trackColor?: string;
  fillColor?: string;
  height?: number;
  indeterminate?: boolean;
  borderRadius?: number;
};

export const AnimatedProgressBar = ({
  progress = 0,
  duration = 2000,
  trackColor = "#EDEDEB",
  fillColor = semantic.heroStart,
  height = 4,
  indeterminate = false,
  borderRadius,
}: AnimatedProgressBarProps) => {
  const widthValue = useSharedValue(0);
  const translateX = useSharedValue(0);
  const resolvedRadius = borderRadius ?? height / 2;

  useEffect(() => {
    if (indeterminate) {
      widthValue.value = 40;
      translateX.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(100, {
            duration,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      );
    } else {
      translateX.value = 0;
      widthValue.value = withTiming(progress * 100, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [indeterminate, progress, duration]);

  const fillStyle = useAnimatedStyle(() => {
    if (indeterminate) {
      return {
        width: `${widthValue.value}%`,
        transform: [
          {
            translateX:
              (translateX.value / 100) *
              (1 - widthValue.value / 100) *
              300,
          },
        ],
      };
    }
    return {
      width: `${widthValue.value}%`,
    };
  });

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: resolvedRadius,
          backgroundColor: trackColor,
        },
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: indeterminate ? undefined : Math.round(progress * 100),
      }}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            borderRadius: resolvedRadius,
            backgroundColor: fillColor,
          },
          fillStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});
