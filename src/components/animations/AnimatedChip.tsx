import { type ReactNode, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { font, semantic } from "@/src/ui/tokens";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ChipState = "idle" | "loading" | "done";

type AnimatedChipProps = {
  label: string;
  icon: ReactNode;
  completedIcon?: ReactNode;
  state?: ChipState;
};

export const AnimatedChip = ({
  label,
  icon,
  completedIcon,
  state = "idle",
}: AnimatedChipProps) => {
  const bgOpacity = useSharedValue(0);

  useEffect(() => {
    bgOpacity.value = withTiming(state === "done" ? 1 : 0, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });
  }, [state]);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor:
      bgOpacity.value > 0
        ? `rgba(63, 154, 116, ${bgOpacity.value * 0.12})`
        : "transparent",
    borderColor:
      bgOpacity.value > 0.5
        ? `rgba(63, 154, 116, ${bgOpacity.value * 0.3})`
        : "#E5E3DF",
  }));

  return (
    <Animated.View
      style={[styles.chip, containerStyle]}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${state === "done" ? "tamamlandı" : state === "loading" ? "işleniyor" : "bekliyor"}`}
    >
      <Text
        style={[
          styles.label,
          state === "done" && styles.labelDone,
        ]}
      >
        {label}
      </Text>

      <View style={styles.iconWrapper}>
        {state === "idle" && (
          <Animated.View entering={FadeIn.duration(200)}>
            {icon}
          </Animated.View>
        )}

        {state === "loading" && <ChipSpinner />}

        {state === "done" && (
          <Animated.View entering={ZoomIn.duration(300).damping(14)}>
            {completedIcon ?? icon}
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
};

const SPINNER_SIZE = 22;
const SPINNER_STROKE = 2;
const SPINNER_R = (SPINNER_SIZE - SPINNER_STROKE) / 2;
const SPINNER_CIRCUMFERENCE = 2 * Math.PI * SPINNER_R;

const ChipSpinner = () => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 800, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const dashProps = useAnimatedProps(() => ({
    strokeDashoffset: SPINNER_CIRCUMFERENCE * 0.65,
  }));

  return (
    <Animated.View entering={FadeIn.duration(200)} style={spinStyle}>
      <Svg
        width={SPINNER_SIZE}
        height={SPINNER_SIZE}
        viewBox={`0 0 ${SPINNER_SIZE} ${SPINNER_SIZE}`}
      >
        <AnimatedCircle
          cx={SPINNER_SIZE / 2}
          cy={SPINNER_SIZE / 2}
          r={SPINNER_R}
          stroke={semantic.success}
          strokeWidth={SPINNER_STROKE}
          fill="none"
          strokeDasharray={`${SPINNER_CIRCUMFERENCE}`}
          animatedProps={dashProps}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E3DF",
    minWidth: 90,
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontFamily: font.medium,
    color: semantic.textSecondary,
  },
  labelDone: {
    color: semantic.success,
    fontFamily: font.semiBold,
  },
  iconWrapper: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
