import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Microphone, Stop } from "phosphor-react-native";
import { useEffect } from "react";
import { semantic, radius } from "@/src/ui/tokens";

type VoiceInputButtonProps = {
  isRecording: boolean;
  isProcessing: boolean;
  onPress: () => void;
  size?: number;
};

export const VoiceInputButton = ({
  isRecording,
  isProcessing,
  onPress,
  size = 48,
}: VoiceInputButtonProps) => {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.6, { duration: 800, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        true,
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 800 }),
          withTiming(0, { duration: 800 }),
        ),
        -1,
        true,
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isRecording, pulseScale, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const iconSize = size * 0.46;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isProcessing}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={isRecording ? "Kaydı durdur" : "Sesle görev ekle"}
      style={styles.touchArea}
    >
      <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
        <Animated.View
          style={[
            styles.pulse,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            pulseStyle,
          ]}
        />
        <View
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            isRecording && styles.buttonRecording,
            isProcessing && styles.buttonProcessing,
          ]}
        >
          {isRecording ? (
            <Stop size={iconSize} color="#FFFFFF" weight="fill" />
          ) : (
            <Microphone
              size={iconSize}
              color={isProcessing ? "#8A7A70" : "#FFFFFF"}
              weight="fill"
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchArea: {
    padding: 4,
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    backgroundColor: semantic.accent,
  },
  button: {
    backgroundColor: semantic.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonRecording: {
    backgroundColor: "#E2513E",
  },
  buttonProcessing: {
    backgroundColor: "#E5E3DF",
  },
});
