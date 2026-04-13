import { useEffect } from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Lock, LockOpen } from "phosphor-react-native";
import { MAX_BLUR } from "@/src/hooks/useHeroReveal";
import { shadow } from "@/src/ui/tokens";

const fallbackHero = require("../../assets/images/hero-sample-full.png");

const SPRING_CONFIG = { damping: 18, stiffness: 90 };

type LockedRevealHeroProps = {
  imageUrl: string | null;
  blurAmount: number;
  progressText: string;
  revealProgress: number;
  isFullyRevealed: boolean;
  onPressFullScreen?: () => void;
};

export const LockedRevealHero = ({
  imageUrl,
  blurAmount,
  progressText,
  revealProgress,
  isFullyRevealed,
  onPressFullScreen,
}: LockedRevealHeroProps) => {
  const animatedBlur = useSharedValue(MAX_BLUR);
  const overlayOpacity = useSharedValue(0.15);
  const cardScale = useSharedValue(1);
  const prevRevealProgress = useSharedValue(0);

  useEffect(() => {
    const targetBlur = isFullyRevealed ? 0 : blurAmount;
    const targetOverlay = isFullyRevealed ? 0 : 0.15 * (1 - revealProgress);

    if (isFullyRevealed && prevRevealProgress.value < 1) {
      cardScale.value = withSequence(
        withTiming(1.02, { duration: 400, easing: Easing.out(Easing.cubic) }),
        withSpring(1, { damping: 14, stiffness: 120 }),
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (revealProgress > prevRevealProgress.value && !isFullyRevealed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    animatedBlur.value = withSpring(targetBlur, SPRING_CONFIG);
    overlayOpacity.value = withSpring(targetOverlay, SPRING_CONFIG);
    prevRevealProgress.value = revealProgress;
  }, [blurAmount, revealProgress, isFullyRevealed]);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const blurIntensity = Math.round(
    Math.min(100, (blurAmount / MAX_BLUR) * 100),
  );

  const heroSource = imageUrl ? { uri: imageUrl } : fallbackHero;

  const progressLabel = isFullyRevealed
    ? "Hak ettin."
    : revealProgress >= 0.66
      ? "Neredeyse tamam..."
      : revealProgress >= 0.33
        ? "Başlangıç güzel."
        : "Görevlerini tamamla, görseli aç.";

  return (
    <Animated.View style={[styles.heroCard, scaleStyle]}>
      <ImageBackground
        source={heroSource}
        style={styles.imageBackground}
        imageStyle={styles.foregroundImage}
        resizeMode="cover"
      >
        {!isFullyRevealed && (
          <BlurView
            intensity={blurIntensity}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
        )}

        {!isFullyRevealed && (
          <View style={[StyleSheet.absoluteFill, styles.frostOverlay]} />
        )}

        <Animated.View
          entering={FadeInUp.delay(300).duration(450).damping(16)}
          style={styles.overlayBottom}
        >
          {isFullyRevealed ? (
            <TouchableOpacity
              style={styles.revealedPill}
              onPress={onPressFullScreen}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Görseli tam ekran görüntüle"
            >
              <LockOpen size={13} color="#FFF" weight="fill" />
              <Text style={styles.revealedPillText}>Görseli Gör</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.lockedBottomWrap}>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${revealProgress * 100}%` },
                  ]}
                />
              </View>
              <View style={styles.lockedRow}>
                <View style={styles.lockIconWrap}>
                  <Lock size={12} color="#FFF" weight="fill" />
                </View>
                <Text style={styles.lockedLabel}>{progressLabel}</Text>
                <Text style={styles.lockedCount}>{progressText}</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </ImageBackground>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    width: "100%",
    height: 272,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 8,
    borderColor: "#E6DED2",
    ...shadow.soft,
    // Keep below white panel's elevation (taskPanel: 12)
    elevation: 4,
  },
  imageBackground: {
    width: "100%",
    height: "100%",
  },
  foregroundImage: {
    width: "100%",
    height: "100%",
  },
  frostOverlay: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  overlayBottom: {
    position: "absolute",
    bottom: 14,
    left: 12,
    right: 12,
    alignItems: "center",
  },
  lockedBottomWrap: {
    width: "100%",
    gap: 8,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },
  lockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lockIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(20, 18, 16, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  lockedLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  lockedCount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  revealedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(20, 18, 16, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  revealedPillText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
});
