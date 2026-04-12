import {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export type ExitDirection = "forward" | "back";

export const useOnboardingExit = () => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const triggerExit = (direction: ExitDirection, onDone: () => void) => {
    "worklet";
    const yTarget = direction === "forward" ? -72 : 72;
    translateY.value = withTiming(yTarget, {
      duration: 210,
      easing: Easing.in(Easing.cubic),
    });
    opacity.value = withTiming(
      0,
      { duration: 180, easing: Easing.in(Easing.ease) },
      (finished) => {
        if (finished) runOnJS(onDone)();
      },
    );
  };

  const exitStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return { triggerExit, exitStyle };
};
