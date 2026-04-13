import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, type TextStyle } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { font, semantic } from "@/src/ui/tokens";

type TypewriterTextProps = {
  text: string;
  speed?: number;
  delay?: number;
  loop?: boolean;
  loopPause?: number;
  style?: TextStyle;
  fadingTip?: boolean;
  onComplete?: () => void;
};

export const TypewriterText = ({
  text,
  speed = 40,
  delay = 0,
  loop = false,
  loopPause = 2000,
  style,
  fadingTip = true,
  onComplete,
}: TypewriterTextProps) => {
  const displayCount = useSharedValue(0);
  const opacity = useSharedValue(1);
  const isRunning = useRef(true);

  const startTyping = useCallback(() => {
    "worklet";
    displayCount.value = 0;
    displayCount.value = withDelay(
      delay,
      withTiming(text.length, {
        duration: text.length * speed,
        easing: Easing.linear,
      }),
    );
  }, [text.length, speed, delay]);

  const handleTypingDone = useCallback(() => {
    if (!isRunning.current) return;
    onComplete?.();

    if (!loop) return;

    const fadeOutTimer = setTimeout(() => {
      if (!isRunning.current) return;
      opacity.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(handleRestart)();
        }
      });
    }, loopPause);

    return () => clearTimeout(fadeOutTimer);
  }, [loop, loopPause, onComplete]);

  const handleRestart = useCallback(() => {
    if (!isRunning.current) return;
    displayCount.value = 0;
    opacity.value = withTiming(1, { duration: 200 }, () => {
      displayCount.value = withTiming(text.length, {
        duration: text.length * speed,
        easing: Easing.linear,
      });
    });
  }, [text.length, speed]);

  useEffect(() => {
    isRunning.current = true;
    startTyping();
    return () => {
      isRunning.current = false;
    };
  }, [startTyping]);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (displayCount.value >= text.length - 0.5) {
        handleTypingDone();
        clearInterval(checkInterval);
      }
    }, speed);
    return () => clearInterval(checkInterval);
  }, [text.length, speed, handleTypingDone]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={containerStyle}
      accessibilityRole="text"
      accessibilityLabel={text}
    >
      <Animated.Text style={[styles.text, style]}>
        {text.split("").map((char, i) => (
          <TypewriterChar
            key={`${i}-${char}`}
            char={char}
            index={i}
            displayCount={displayCount}
            fadingTip={fadingTip}
            style={style}
          />
        ))}
      </Animated.Text>
    </Animated.View>
  );
};

type TypewriterCharProps = {
  char: string;
  index: number;
  displayCount: SharedValue<number>;
  fadingTip: boolean;
  style?: TextStyle;
};

const TypewriterChar = ({
  char,
  index,
  displayCount,
  fadingTip,
  style,
}: TypewriterCharProps) => {
  const animStyle = useAnimatedStyle(() => {
    const count = Math.floor(displayCount.value);
    if (index > count) return { opacity: 0 };

    const isTip = fadingTip && index === count;
    return { opacity: isTip ? 0.4 : 1 };
  });

  return (
    <Animated.Text style={[styles.text, style, animStyle]}>
      {char}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    fontFamily: font.medium,
    color: semantic.textPrimary,
  },
});
