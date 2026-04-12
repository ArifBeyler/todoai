import { router } from "expo-router";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect, useRef, useState } from "react";
import { Check } from "phosphor-react-native";
import { useSessionStore } from "@state/useSessionStore";
import { VISUAL_STYLES } from "@/src/constants/styles";
import { font, radius, semantic, shadow, spacing } from "@/src/ui/tokens";
import { preHomeMotion } from "@/src/ui/motion";
import {
  OnboardingStaggeredParagraph,
  countStaggerSteps,
} from "@/src/components/OnboardingStaggeredText";
import { OnboardingProgress } from "@/src/components/OnboardingProgress";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";

const STYLE_IMAGES: Record<string, ImageSourcePropType[]> = {
  "3d": [
    require("../../assets/images/style-3d-erkek1.png"),
    require("../../assets/images/style-3d-erkek2.png"),
    require("../../assets/images/style-3d-kadin1.png"),
  ],
  lofi: [
    require("../../assets/images/style-lofi-erkek1.png"),
    require("../../assets/images/style-lofi-erkek2.png"),
    require("../../assets/images/style-lofi-kadin1.png"),
  ],
};

const IMAGE_COUNT = 3;
const ROTATION_MS = 3000;
const CIRCLE_SIZE = 170;

export default function StyleScreen() {
  const { stylePreference, setStylePreference } = useSessionStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { triggerExit, exitStyle } = useOnboardingExit();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % IMAGE_COUNT);
    }, ROTATION_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleContinue = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    triggerExit("forward", () => router.push("/(onboarding)/ai-explanation"));
  };

  const handleBack = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    triggerExit("back", () => router.back());
  };

  const titleStr = "Tarzını seç";
  const subStr = "Tüm görsellerinin oluşturulacağı stili belirle.";
  const st = 33;
  const titleSteps = countStaggerSteps(titleStr);

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      <OnboardingProgress current={8} total={11} />
      <View>
        <OnboardingStaggeredParagraph
          text={titleStr}
          style={styles.title}
          staggerMs={st}
        />
        <OnboardingStaggeredParagraph
          text={subStr}
          style={styles.sub}
          startDelay={titleSteps * st + 64}
          staggerMs={24}
          containerStyle={{ marginTop: 6 }}
        />
      </View>

      <Animated.View
        entering={preHomeMotion.sectionEnter(100)}
        style={styles.optionsRow}
      >
        {VISUAL_STYLES.map((item) => (
          <StyleOption
            key={item.value}
            value={item.value}
            label={item.label}
            description={item.description}
            isSelected={stylePreference === item.value}
            images={STYLE_IMAGES[item.value] ?? []}
            currentIndex={currentIndex}
            onPress={() => setStylePreference(item.value)}
          />
        ))}
      </Animated.View>

      <Animated.View
        entering={preHomeMotion.ctaEnter(200)}
        style={styles.bottom}
      >
        <OnboardingFooter
          onNext={handleContinue}
          onBack={handleBack}
          showBack
        />
      </Animated.View>
    </Animated.View>
  );
}

type StyleOptionProps = {
  value: string;
  label: string;
  description: string;
  isSelected: boolean;
  images: ImageSourcePropType[];
  currentIndex: number;
  onPress: () => void;
};

const StyleOption = ({
  label,
  description,
  isSelected,
  images,
  currentIndex,
  onPress,
}: StyleOptionProps) => {
  const scale = useSharedValue(isSelected ? 1 : 0.92);
  const opacityVal = useSharedValue(isSelected ? 1 : 0.55);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1 : 0.92, {
      damping: 14,
      stiffness: 160,
    });
    opacityVal.value = withSpring(isSelected ? 1 : 0.55, {
      damping: 14,
      stiffness: 160,
    });
  }, [isSelected]);

  const animatedCircle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacityVal.value,
  }));

  return (
    <TouchableOpacity
      style={styles.optionContainer}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.circleOuter,
          isSelected && styles.circleOuterSelected,
          animatedCircle,
        ]}
      >
        <View style={styles.carouselContainer}>
          {images[0] && (
            <CarouselLayer
              source={images[0]}
              isActive={currentIndex === 0}
            />
          )}
          {images[1] && (
            <CarouselLayer
              source={images[1]}
              isActive={currentIndex === 1}
              absolute
            />
          )}
          {images[2] && (
            <CarouselLayer
              source={images[2]}
              isActive={currentIndex === 2}
              absolute
            />
          )}
        </View>
        {isSelected && (
          <View style={styles.checkBadge}>
            <Check size={14} color="#FFF" weight="bold" />
          </View>
        )}
      </Animated.View>
      <Text
        style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
      >
        {label}
      </Text>
      <Text style={styles.optionDesc}>{description}</Text>
    </TouchableOpacity>
  );
};

type CarouselLayerProps = {
  source: ImageSourcePropType;
  isActive: boolean;
  absolute?: boolean;
};

const CarouselLayer = ({ source, isActive, absolute }: CarouselLayerProps) => {
  const opacity = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(isActive ? 1 : 0, {
      duration: 500,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Image
      source={source}
      style={[
        styles.circleImage,
        absolute && styles.imageAbsolute,
        animatedStyle,
      ]}
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
    fontSize: 36,
    lineHeight: 40,
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
  optionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 28,
    flex: 1,
    alignItems: "center",
  },
  optionContainer: {
    alignItems: "center",
    gap: 10,
    flex: 1,
    maxWidth: 190,
  },
  circleOuter: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    backgroundColor: semantic.screenSurface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  circleOuterSelected: {
    borderWidth: 3,
    borderColor: semantic.heroStart,
    shadowColor: semantic.heroStart,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  carouselContainer: {
    width: "100%",
    height: "100%",
  },
  circleImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  checkBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textSecondary,
    letterSpacing: -0.2,
  },
  optionLabelSelected: {
    color: semantic.textPrimary,
  },
  optionDesc: {
    fontSize: 12,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
  bottom: {
    marginTop: "auto",
  },
  button: {
    borderRadius: radius.lg,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    paddingVertical: 17,
  },
  buttonText: {
    color: semantic.textOnDark,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: font.bold,
  },
});
