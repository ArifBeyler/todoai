import { useEffect } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const SPRING_CONFIG = { damping: 15, stiffness: 150 };

type UseCardSelectAnimationOptions = {
  isSelected: boolean;
  selectedBorderColor?: string;
  defaultBorderColor?: string;
  selectedBgColor?: string;
  defaultBgColor?: string;
};

export const useCardSelectAnimation = ({
  isSelected,
  selectedBorderColor = "#111111",
  defaultBorderColor = "rgba(0, 0, 0, 0.08)",
  selectedBgColor = "#EDEDEB",
  defaultBgColor = "#FAFAF9",
}: UseCardSelectAnimationOptions) => {
  const scale = useSharedValue(1);
  const progress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isSelected ? 1 : 0, SPRING_CONFIG);
    if (isSelected) {
      scale.value = withSpring(1.02, SPRING_CONFIG, () => {
        scale.value = withSpring(1, SPRING_CONFIG);
      });
    }
  }, [isSelected]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor:
      progress.value > 0.5 ? selectedBorderColor : defaultBorderColor,
    backgroundColor:
      progress.value > 0.5 ? selectedBgColor : defaultBgColor,
  }));

  return cardAnimStyle;
};
