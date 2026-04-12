import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { CheckCircle, Sparkle, ArrowRight } from "phosphor-react-native";
import { useSessionStore } from "@state/useSessionStore";
import { font, radius, semantic, shadow, spacing } from "@/src/ui/tokens";
import { preHomeMotion } from "@/src/ui/motion";
import {
  OnboardingStaggeredParagraph,
  countStaggerSteps,
} from "@/src/components/OnboardingStaggeredText";
import { OnboardingProgress } from "@/src/components/OnboardingProgress";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";

type DemoTodo = {
  id: string;
  label: string;
  image: ImageSourcePropType;
};

const DEMO_TODOS: DemoTodo[] = [
  {
    id: "dino",
    label: "Dinozoru besle",
    image: require("../../assets/images/demo-todo-dino.png"),
  },
  {
    id: "flower",
    label: "Çiçekleri sula",
    image: require("../../assets/images/demo-todo-flower.png"),
  },
  {
    id: "sport",
    label: "Spor yap",
    image: require("../../assets/images/demo-todo-sport.png"),
  },
];

const AUTO_CHECK_DELAY = 1286;
const AUTO_CHECK_INTERVAL = 1000;

export default function AIExplanationScreen() {
  const profileName = useSessionStore((s) => s.profileName);
  const [checkedIndex, setCheckedIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { triggerExit, exitStyle } = useOnboardingExit();

  const allChecked = checkedIndex >= DEMO_TODOS.length - 1;

  useEffect(() => {
    const checkNext = (idx: number) => {
      if (idx >= DEMO_TODOS.length) return;
      timerRef.current = setTimeout(() => {
        setCheckedIndex(idx);
        checkNext(idx + 1);
      }, idx === 0 ? AUTO_CHECK_DELAY : AUTO_CHECK_INTERVAL);
    };
    checkNext(0);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const titleStr = profileName
    ? `${profileName}, görevlerin\ngörsellere dönüşür`
    : "Görevlerin\ngörsellere dönüşür";
  const subStr =
    "Her tamamladığın görev, sana özel bir görsele dönüşür.";
  const st = 31;
  const titleSteps = countStaggerSteps(titleStr);

  const handleContinue = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    triggerExit("forward", () => router.push("/(onboarding)/prod-time"));
  };

  const handleBack = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    triggerExit("back", () => router.back());
  };

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      <OnboardingProgress current={9} total={11} />
      <View>
        <OnboardingStaggeredParagraph
          text={titleStr}
          style={styles.title}
          staggerMs={st}
        />
        <OnboardingStaggeredParagraph
          text={subStr}
          style={styles.sub}
          startDelay={titleSteps * st + 71}
          staggerMs={23}
          containerStyle={{ marginTop: 8 }}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.todoList}>
          {DEMO_TODOS.map((todo, i) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              isChecked={checkedIndex >= i}
              delay={286 + i * 250}
            />
          ))}
        </View>

        <Animated.View
          entering={preHomeMotion.sectionEnter(1071)}
          style={styles.imageSection}
        >
          <View style={[styles.imageFrame, shadow.card]}>
            <ImagePlaceholder />
            {DEMO_TODOS.map((todo, i) => (
              <ImageLayer
                key={todo.id}
                source={todo.image}
                isActive={checkedIndex === i}
                isLast={i === DEMO_TODOS.length - 1 && checkedIndex >= i}
              />
            ))}
          </View>
        </Animated.View>
      </View>

      <Animated.View
        entering={preHomeMotion.ctaEnter(1286)}
        style={styles.bottom}
      >
        <OnboardingFooter
          onNext={handleContinue}
          onBack={handleBack}
          nextDisabled={!allChecked}
          nextLabel={allChecked ? "Devam Et" : "Görevleri tamamla"}
          showBack
        />
      </Animated.View>
    </Animated.View>
  );
}

type TodoRowProps = {
  todo: DemoTodo;
  isChecked: boolean;
  delay: number;
};

const TodoRow = ({ todo, isChecked, delay }: TodoRowProps) => {
  const checkScale = useSharedValue(0);

  useEffect(() => {
    checkScale.value = withSpring(isChecked ? 1 : 0, {
      damping: 12,
      stiffness: 180,
    });
  }, [isChecked]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + checkScale.value * 0.4 }],
    opacity: 0.4 + checkScale.value * 0.6,
  }));

  return (
    <Animated.View
      entering={preHomeMotion.cardEnter(delay)}
    >
      <View style={styles.todoRow}>
        <Animated.View style={checkStyle}>
          {isChecked ? (
            <CheckCircle size={24} color={semantic.success} weight="fill" />
          ) : (
            <View style={styles.emptyCheckbox} />
          )}
        </Animated.View>
        <Text
          style={[styles.todoLabel, isChecked && styles.todoLabelChecked]}
        >
          {todo.label}
        </Text>
      </View>
    </Animated.View>
  );
};

const ImagePlaceholder = () => (
  <View style={styles.placeholderContainer}>
    <Sparkle size={40} color={semantic.border} weight="duotone" />
    <Text style={styles.placeholderText}>Görevini tamamla</Text>
  </View>
);

type ImageLayerProps = {
  source: ImageSourcePropType;
  isActive: boolean;
  isLast: boolean;
};

const ImageLayer = ({ source, isActive, isLast }: ImageLayerProps) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    const shouldShow = isActive || isLast;
    opacity.value = withTiming(shouldShow ? 1 : 0, {
      duration: 600,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isActive, isLast]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Image
      source={source}
      style={[styles.visualImage, animatedStyle]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F0",
    paddingHorizontal: spacing.xl,
    paddingTop: 74,
    paddingBottom: 50,
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -0.7,
  },
  sub: {
    marginTop: spacing.xs,
    fontSize: 15,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    lineHeight: 22,
  },
  content: {
    flex: 1,
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  todoList: {
    gap: 10,
  },
  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: semantic.screenSurface,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  emptyCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.15)",
  },
  todoLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: font.semiBold,
    color: semantic.textPrimary,
  },
  todoLabelChecked: {
    textDecorationLine: "line-through",
    color: semantic.textSecondary,
  },
  imageSection: {
    alignItems: "center",
    gap: spacing.sm,
  },
  imageFrame: {
    width: "100%",
    height: 220,
    borderRadius: 32,
    borderWidth: 8,
    borderColor: "#E6DED2",
    overflow: "hidden",
    backgroundColor: semantic.screenSurface,
    shadowColor: "rgba(0,0,0,0.10)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
  },
  placeholderContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: font.semiBold,
    color: semantic.border,
  },
  visualImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  bottom: {
    marginTop: "auto",
  },
  button: {
    borderRadius: radius.lg,
    backgroundColor: semantic.heroStart,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: semantic.border,
  },
  buttonText: {
    color: semantic.textOnDark,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: font.bold,
  },
  buttonTextDisabled: {
    color: semantic.textSecondary,
  },
});
