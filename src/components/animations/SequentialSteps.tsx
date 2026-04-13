import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { font, semantic } from "@/src/ui/tokens";

type StepItem = {
  label: string;
};

type SequentialStepsProps = {
  steps: StepItem[];
  currentStep: number;
};

export const SequentialSteps = ({
  steps,
  currentStep,
}: SequentialStepsProps) => (
  <View style={styles.row} accessibilityRole="progressbar">
    {steps.map((step, i) => {
      const isCompleted = currentStep > i;
      const isActive = currentStep === i;
      return (
        <View key={i} style={styles.stepContainer}>
          <StepCircle
            index={i}
            isCompleted={isCompleted}
            isActive={isActive}
          />
          <Text
            style={[
              styles.label,
              (isCompleted || isActive) && styles.labelActive,
            ]}
          >
            {step.label}
          </Text>
          {i < steps.length - 1 && (
            <StepLine filled={currentStep > i} />
          )}
        </View>
      );
    })}
  </View>
);

type StepCircleProps = {
  index: number;
  isCompleted: boolean;
  isActive: boolean;
};

const StepCircle = ({ index, isCompleted, isActive }: StepCircleProps) => {
  const bgProgress = useSharedValue(0);

  useEffect(() => {
    bgProgress.value = withTiming(isCompleted || isActive ? 1 : 0, {
      duration: 350,
      easing: Easing.out(Easing.ease),
    });
  }, [isCompleted, isActive]);

  const circleStyle = useAnimatedStyle(() => ({
    backgroundColor:
      bgProgress.value > 0.5
        ? semantic.heroStart
        : "rgba(0,0,0,0.08)",
  }));

  const textColor = isCompleted || isActive ? "#FFFFFF" : semantic.textSecondary;

  return (
    <Animated.View style={[styles.circle, circleStyle]}>
      <Text style={[styles.circleText, { color: textColor }]}>
        {index + 1}
      </Text>
    </Animated.View>
  );
};

type StepLineProps = {
  filled: boolean;
};

const StepLine = ({ filled }: StepLineProps) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(filled ? 1 : 0, {
      duration: 500,
      easing: Easing.inOut(Easing.ease),
    });
  }, [filled]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.lineTrack}>
      <Animated.View style={[styles.lineFill, fillStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    width: "100%",
  },
  stepContainer: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  circleText: {
    fontSize: 15,
    fontFamily: font.bold,
    fontWeight: "700",
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: font.medium,
    color: semantic.textSecondary,
    textAlign: "center",
  },
  labelActive: {
    color: semantic.textPrimary,
    fontFamily: font.semiBold,
  },
  lineTrack: {
    position: "absolute",
    top: 17,
    left: "55%",
    right: "-45%",
    height: 2,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 1,
    overflow: "hidden",
  },
  lineFill: {
    height: 2,
    backgroundColor: semantic.heroStart,
    borderRadius: 1,
  },
});
