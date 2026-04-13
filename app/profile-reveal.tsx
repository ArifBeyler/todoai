import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import { Image } from "react-native";
import * as Haptics from "expo-haptics";
import { Sparkle, Star, CheckCircle } from "phosphor-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSessionStore } from "@state/useSessionStore";
import { font, semantic, shadow, spacing } from "@/src/ui/tokens";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const PHOTO_SIZE = Math.round(SCREEN_W * 0.55);

/**
 * First Profile Reveal Screen
 *
 * Animates the user's original uploaded photo morphing into the new AI-generated
 * avatar: original fades out while generated fades in with scale + glow effects.
 * On confirm, promotes generatedAvatarUrl → profilePhoto in session store.
 */
export default function ProfileRevealScreen() {
  const insets = useSafeAreaInsets();
  const { profilePhoto, generatedAvatarUrl, confirmGeneratedAvatar } = useSessionStore();

  // --- Animation shared values ---
  const photoScale = useSharedValue(0.88);
  const photoOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.8);
  const ringOpacity = useSharedValue(0);

  // Original photo fades OUT, generated fades IN
  const originalOpacity = useSharedValue(1);
  const generatedOpacity = useSharedValue(0);
  const generatedScale = useSharedValue(1.08);

  // Shine sweep + sparkles
  const shineProgress = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);
  const sparkleScale = useSharedValue(0.6);
  const badgeScale = useSharedValue(0);
  const morphComplete = useSharedValue(0);

  const hapticFiredRef = useRef(false);

  const fireSuccessHaptic = () => {
    if (!hapticFiredRef.current) {
      hapticFiredRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  useEffect(() => {
    // Phase 1 (0–600ms): wrap slides in, original photo appears
    photoOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
    photoScale.value = withSpring(1, { damping: 16, stiffness: 110 });
    ringOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    ringScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 80 }));

    // Phase 2 (1400ms): shine sweeps across — signals the morph is about to happen
    shineProgress.value = withDelay(
      1400,
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
    );

    // Phase 3 (2000ms): original fades out, generated fades in + shrinks to natural size
    originalOpacity.value = withDelay(
      2000,
      withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
    );
    generatedOpacity.value = withDelay(
      2000,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }),
    );
    generatedScale.value = withDelay(
      2000,
      withSpring(1, { damping: 18, stiffness: 100 }),
    );
    morphComplete.value = withDelay(2000, withTiming(1, { duration: 700 }));

    // Phase 4 (2600ms): sparkles burst + haptic
    sparkleOpacity.value = withDelay(
      2600,
      withSequence(
        withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) }),
        withDelay(1200, withTiming(0, { duration: 500 })),
      ),
    );
    sparkleScale.value = withDelay(
      2600,
      withSpring(1, { damping: 10, stiffness: 140 }),
    );
    badgeScale.value = withDelay(
      2700,
      withSpring(1, { damping: 12, stiffness: 120 }),
    );

    // Haptic fires exactly when generated photo is fully visible
    const hapticTimer = setTimeout(() => {
      runOnJS(fireSuccessHaptic)();
    }, 2700);

    return () => clearTimeout(hapticTimer);
  }, [
    photoOpacity,
    photoScale,
    ringOpacity,
    ringScale,
    originalOpacity,
    generatedOpacity,
    generatedScale,
    shineProgress,
    sparkleOpacity,
    sparkleScale,
    badgeScale,
    morphComplete,
  ]);

  // --- Animated styles ---
  const photoWrapStyle = useAnimatedStyle(() => ({
    opacity: photoOpacity.value,
    transform: [{ scale: photoScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const originalLayerStyle = useAnimatedStyle(() => ({
    opacity: originalOpacity.value,
  }));

  const generatedLayerStyle = useAnimatedStyle(() => ({
    opacity: generatedOpacity.value,
    transform: [{ scale: generatedScale.value }],
  }));

  const shineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      shineProgress.value,
      [0, 0.3, 0.6, 1],
      [0, 0.65, 0.45, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateX: interpolate(
          shineProgress.value,
          [0, 1],
          [-PHOTO_SIZE, PHOTO_SIZE * 1.2],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
    transform: [{ scale: sparkleScale.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(badgeScale.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: badgeScale.value }],
  }));

  const ringGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(morphComplete.value, [0, 1], [0.4, 1], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(morphComplete.value, [0, 1], [1, 1.06], Extrapolation.CLAMP),
      },
    ],
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    confirmGeneratedAvatar();
    router.replace("/(tabs)/home");
  };

  const displayedOriginal = profilePhoto;
  const displayedGenerated = generatedAvatarUrl ?? profilePhoto;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={["#1A1410", "#2C2118", "#1A1410"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glow — brightens when morph completes */}
      <Animated.View style={[styles.ambientGlow, ringGlowStyle]} />

      {/* Header text */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(500).springify().damping(18)}
        style={styles.headerSection}
      >
        <Animated.View style={[styles.badgePill, badgeStyle]}>
          <CheckCircle size={13} color="#F8D87A" weight="fill" />
          <Text style={styles.badgePillText}>AI Profil Hazır</Text>
        </Animated.View>
        <Text style={styles.title}>Profilin hazır</Text>
        <Text style={styles.subtitle}>
          Artık görsellerin sana özel{"\n"}üretilecek.
        </Text>
      </Animated.View>

      {/* Photo reveal area */}
      <View style={styles.photoSection}>
        {/* Outer decorative ring */}
        <Animated.View style={[styles.ringWrap, ringStyle]}>
          <Animated.View style={[StyleSheet.absoluteFill, ringGlowStyle]}>
            <LinearGradient
              colors={[
                "rgba(248,216,122,0.6)",
                "rgba(248,216,122,0.12)",
                "rgba(248,216,122,0.5)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ringGradient}
            />
          </Animated.View>
        </Animated.View>

        {/* Photo layers (original under generated) */}
        <Animated.View style={[styles.photoWrap, photoWrapStyle]}>
          {/* Layer 1: original uploaded photo (fades out) */}
          {displayedOriginal ? (
            <Animated.View style={[StyleSheet.absoluteFill, originalLayerStyle]}>
              <Image
                source={{ uri: displayedOriginal }}
                style={styles.photo}
                resizeMode="cover"
              />
            </Animated.View>
          ) : null}

          {/* Layer 2: AI-generated avatar (fades in) */}
          {displayedGenerated ? (
            <Animated.View style={[StyleSheet.absoluteFill, generatedLayerStyle]}>
              <Image
                source={{ uri: displayedGenerated }}
                style={styles.photo}
                resizeMode="cover"
              />
            </Animated.View>
          ) : null}

          {/* Shine sweep that plays between the two photo states */}
          <Animated.View style={[styles.shineOverlay, shineStyle]} />
        </Animated.View>

        {/* Sparkle particles that appear when morph completes */}
        <Animated.View style={[styles.sparkleTopLeft, sparkleStyle]}>
          <Star size={20} color="#F8D87A" weight="fill" />
        </Animated.View>
        <Animated.View style={[styles.sparkleTopRight, sparkleStyle]}>
          <Sparkle size={15} color="#FFFFFF" weight="fill" />
        </Animated.View>
        <Animated.View style={[styles.sparkleBottomLeft, sparkleStyle]}>
          <Sparkle size={13} color="#F8D87A" weight="fill" />
        </Animated.View>
        <Animated.View style={[styles.sparkleBottomRight, sparkleStyle]}>
          <Star size={11} color="rgba(255,255,255,0.8)" weight="fill" />
        </Animated.View>
      </View>

      {/* Bottom CTA */}
      <Animated.View
        entering={FadeInUp.delay(900).duration(450).springify().damping(18)}
        style={[styles.ctaSection, { paddingBottom: insets.bottom + 24 }]}
      >
        <Text style={styles.ctaNote}>
          Her gün yeni bir kişisel görsel seni bekliyor.
        </Text>

        <TouchableOpacity
          style={[styles.continueButton, shadow.soft]}
          onPress={handleContinue}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Devam et"
        >
          <Text style={styles.continueButtonText}>Devam et</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
  },
  ambientGlow: {
    position: "absolute",
    width: PHOTO_SIZE * 2.4,
    height: PHOTO_SIZE * 2.4,
    borderRadius: PHOTO_SIZE * 1.2,
    backgroundColor: "rgba(248,216,122,0.07)",
    top: SCREEN_H * 0.28,
    alignSelf: "center",
  },
  headerSection: {
    alignItems: "center",
    gap: 10,
    marginTop: 40,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    backgroundColor: "rgba(248,216,122,0.16)",
    borderWidth: 1,
    borderColor: "rgba(248,216,122,0.28)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 4,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#F8D87A",
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 38,
    fontWeight: "700",
    fontFamily: font.bold,
    color: "#FAFAF9",
    textAlign: "center",
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: font.regular,
    color: "rgba(250,250,249,0.60)",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 260,
  },
  photoSection: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  ringWrap: {
    position: "absolute",
    width: PHOTO_SIZE + 32,
    height: PHOTO_SIZE + 32,
    borderRadius: (PHOTO_SIZE + 32) / 2,
    overflow: "hidden",
  },
  ringGradient: {
    width: "100%",
    height: "100%",
    borderRadius: (PHOTO_SIZE + 32) / 2,
    borderWidth: 2.5,
    borderColor: "transparent",
  },
  photoWrap: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(248,216,122,0.40)",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  shineOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: PHOTO_SIZE * 0.30,
    backgroundColor: "rgba(255,255,255,0.22)",
    transform: [{ skewX: "-12deg" }],
  },
  sparkleTopLeft: {
    position: "absolute",
    top: "8%",
    left: "8%",
  },
  sparkleTopRight: {
    position: "absolute",
    top: "6%",
    right: "6%",
  },
  sparkleBottomLeft: {
    position: "absolute",
    bottom: "12%",
    left: "10%",
  },
  sparkleBottomRight: {
    position: "absolute",
    bottom: "18%",
    right: "8%",
  },
  ctaSection: {
    width: "100%",
    alignItems: "center",
    gap: 14,
  },
  ctaNote: {
    fontSize: 13,
    fontFamily: font.regular,
    color: "rgba(250,250,249,0.50)",
    textAlign: "center",
    lineHeight: 18,
  },
  continueButton: {
    width: "100%",
    backgroundColor: "#FAFAF9",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: font.bold,
    color: "#111111",
  },
});
