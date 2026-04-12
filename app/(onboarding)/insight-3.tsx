import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Sparkle } from "phosphor-react-native";
import { useSessionStore } from "@state/useSessionStore";
import { useFTUEStore } from "@state/useFTUEStore";
import { pollAvatarStatus } from "@/src/services/photoUpload";
import { font, radius, semantic, shadow, spacing } from "@/src/ui/tokens";
import { onboardingTyping, preHomeMotion } from "@/src/ui/motion";
import { OnboardingStaggeredParagraph } from "@/src/components/OnboardingStaggeredText";
import { SequentialTyping } from "@/src/components/SequentialTyping";

const POLL_INTERVAL_MS = 3_000;
const MAX_POLLS = 20;
const TESTIMONIAL_INTERVAL_MS = 2_500;

const PHOTO_SIZE = 220;
const RING_PAD = 12;
const RING_SIZE = PHOTO_SIZE + RING_PAD * 2;
const CROSSFADE_MS = 900;

/** Tek satırda gösterilir; uzunsa … ile kısalır. */
const TESTIMONIALS = [
  { text: "İlk görselimde çok şaşırdım, harika olmuş!", author: "Selin M." },
  { text: "Görevlerde kendimi görmek bambaşka motivasyon.", author: "Oğuz R." },
  { text: "Yapay zekâ beni gerçekten iyi yansıtmış.", author: "Elif K." },
  { text: "Arkadaşlarıma gösterdim, herkes indirmek istedi.", author: "Can B." },
  { text: "Her görevde yeni bir sürpriz bekliyorum.", author: "Zeynep T." },
];

const SPARKLE_POSITIONS = [
  { top: -8, left: -8 },
  { top: -6, right: -10 },
  { bottom: -6, left: -6 },
  { bottom: -10, right: -8 },
];

export default function Insight3Screen() {
  const profilePhoto = useSessionStore((s) => s.profilePhoto);
  const setAvatarStatus = useFTUEStore((s) => s.setAvatarStatus);

  const [avatarReady, setAvatarReady] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const pollCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const testimonialTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(false);

  const originalOpacity = useSharedValue(1);
  const avatarOpacity = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const ringGlow = useSharedValue(0);
  const titleScale = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  useEffect(() => {
    testimonialTimerRef.current = setInterval(() => {
      setTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length);
    }, TESTIMONIAL_INTERVAL_MS);
    return () => {
      if (testimonialTimerRef.current) clearInterval(testimonialTimerRef.current);
    };
  }, []);

  const showReadyState = useCallback(
    (url: string | undefined) => {
      if (doneRef.current) return;
      doneRef.current = true;

      if (testimonialTimerRef.current) clearInterval(testimonialTimerRef.current);

      setAvatarUrl(url ?? null);
      setAvatarStatus("ready");

      setTimeout(() => {
        setAvatarReady(true);

        ringGlow.value = withDelay(
          200,
          withRepeat(
            withSequence(
              withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
              withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            ),
            3,
            true,
          ),
        );

        originalOpacity.value = withDelay(
          500,
          withTiming(0, { duration: CROSSFADE_MS, easing: Easing.inOut(Easing.ease) }),
        );
        avatarOpacity.value = withDelay(
          500,
          withTiming(1, { duration: CROSSFADE_MS, easing: Easing.inOut(Easing.ease) }),
        );

        ringScale.value = withDelay(
          300,
          withSequence(
            withTiming(1.1, { duration: 400, easing: Easing.out(Easing.ease) }),
            withSpring(1, { damping: 8, stiffness: 120 }),
          ),
        );

        titleScale.value = withDelay(
          900,
          withSequence(
            withSpring(1.12, { damping: 6, stiffness: 180 }),
            withSpring(1, { damping: 10, stiffness: 120 }),
          ),
        );
      }, 100);
    },
    [setAvatarStatus],
  );

  useEffect(() => {
    const doPoll = async () => {
      if (doneRef.current || pollCountRef.current >= MAX_POLLS) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      pollCountRef.current += 1;
      try {
        const result = await pollAvatarStatus();
        if (result.status === "succeeded") {
          if (timerRef.current) clearInterval(timerRef.current);
          showReadyState(result.avatarUrl);
        }
      } catch {
        // network error — keep polling
      }
    };

    doPoll();
    timerRef.current = setInterval(doPoll, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showReadyState]);

  const isPremium = useSessionStore((s) => s.isPremium);
  const completeOnboarding = useSessionStore((s) => s.completeOnboarding);
  const paywallInteraction = useFTUEStore((s) => s.paywallInteraction);

  const handleContinue = () => {
    if (!avatarReady) {
      setAvatarStatus("processing");
    }
    if (isPremium || paywallInteraction === "subscribed") {
      completeOnboarding();
      router.replace("/(tabs)/home");
      return;
    }
    router.push("/paywall?mode=hard");
  };

  const originalPhotoStyle = useAnimatedStyle(() => ({
    opacity: originalOpacity.value,
  }));

  const avatarPhotoStyle = useAnimatedStyle(() => ({
    opacity: avatarOpacity.value,
  }));

  const ringAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    borderColor: `rgba(255, 105, 86, ${0.15 + ringGlow.value * 0.45})`,
    shadowOpacity: 0.15 + ringGlow.value * 0.25,
    shadowRadius: 20 + ringGlow.value * 16,
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value || 1 }],
  }));

  const processingDotStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const testimonial = TESTIMONIALS[testimonialIdx];

  const processingTypingLines = useMemo(
    () => [
      {
        text: "Avatarın hazırlanıyor",
        pauseBeforeMs: 220,
        pauseAfterMs: 360,
        style: styles.title,
      },
      {
        text: "Yapay zekâ fotoğrafından kişiselleştirilmiş pixel avatarını oluşturuyor.",
        pauseBeforeMs: 0,
        pauseAfterMs: 0,
        style: styles.description,
      },
    ],
    [],
  );

  if (avatarReady) {
    return (
      <View style={styles.container}>
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.revealContent}
        >
          <View style={styles.ringContainer}>
            <Animated.View style={[styles.photoRing, ringAnimStyle]}>
              {profilePhoto && (
                <Animated.Image
                  source={{ uri: profilePhoto }}
                  style={[styles.photo, styles.photoAbsolute, originalPhotoStyle]}
                />
              )}
              {avatarUrl && (
                <Animated.Image
                  source={{ uri: avatarUrl }}
                  style={[styles.photo, styles.photoAbsolute, avatarPhotoStyle]}
                />
              )}
              {!avatarUrl && profilePhoto && (
                <Image source={{ uri: profilePhoto }} style={styles.photo} />
              )}
            </Animated.View>

            {SPARKLE_POSITIONS.map((pos, i) => (
              <Animated.View
                key={i}
                entering={FadeIn.delay(600 + i * 150).duration(400)}
                style={[styles.sparkleFloat, pos]}
              >
                <Sparkle
                  size={i % 2 === 0 ? 18 : 14}
                  color={semantic.accent}
                  weight="fill"
                />
              </Animated.View>
            ))}
          </View>

          <Animated.View
            entering={FadeIn.delay(571).duration(286)}
            style={titleAnimStyle}
          >
            <OnboardingStaggeredParagraph
              text="Sen Hazırsın!"
              style={styles.revealTitle}
              startDelay={585}
              staggerMs={26}
              lineJustifyContent="center"
            />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(699).duration(271)}>
            <OnboardingStaggeredParagraph
              text={
                "Yapay zekâ avatarını başarıyla oluşturdu.\nArtık görevlerinde kendini göreceksin."
              }
              style={styles.revealDescription}
              startDelay={714}
              staggerMs={19}
              lineJustifyContent="center"
            />
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(841).duration(271)}
            style={styles.revealBadge}
          >
            <Sparkle size={18} color={semantic.accent} weight="fill" />
            <OnboardingStaggeredParagraph
              text="Her görevde seni göreceksin"
              style={styles.revealBadgeText}
              startDelay={870}
              staggerMs={17}
              lineGap={0}
              lineJustifyContent="center"
              containerStyle={styles.revealBadgeTextWrap}
            />
          </Animated.View>
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(984).duration(271)}
          style={styles.footer}
        >
          <TouchableOpacity
            style={[styles.startButton, shadow.soft]}
            onPress={handleContinue}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Başla"
          >
            <Sparkle size={18} color="#FFFFFF" weight="fill" />
            <Text style={styles.startButtonText}>Hadi Başlayalım!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          entering={preHomeMotion.sectionEnter(100)}
          style={styles.iconContainer}
        >
          <View style={styles.iconCircle}>
            <Sparkle size={40} color={semantic.accent} weight="fill" />
          </View>
        </Animated.View>

        <Animated.View
          entering={preHomeMotion.sectionEnter(171)}
          style={styles.textTypingBlock}
        >
          <SequentialTyping
            lines={processingTypingLines}
            charDelayMs={onboardingTyping.charDelayMs}
            showCursor={onboardingTyping.showCursor}
            containerStyle={styles.sequentialTypingWrap}
          />
        </Animated.View>

        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={[styles.dot, processingDotStyle]}
            />
          ))}
        </View>

        <Animated.View
          entering={preHomeMotion.cardEnter(328)}
          style={styles.testimonialCardOuter}
        >
          <Animated.View
            key={testimonialIdx}
            entering={FadeIn.duration(280)}
            style={styles.testimonialCard}
          >
            <Text
              style={styles.testimonialText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              &ldquo;{testimonial.text}&rdquo;
            </Text>
            <Text style={styles.testimonialAuthor}>{testimonial.author}</Text>
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View
        entering={preHomeMotion.ctaEnter(400)}
        style={styles.footer}
      >
        <TouchableOpacity
          style={[styles.button, shadow.soft]}
          onPress={handleContinue}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Devam et"
        >
          <Text style={styles.buttonText}>Devam Et</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.appBackground,
    paddingHorizontal: spacing.xl,
    paddingTop: 100,
    paddingBottom: 50,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginTop: -40,
    width: "100%",
  },
  textTypingBlock: {
    width: "100%",
    paddingHorizontal: spacing.xs,
  },
  sequentialTypingWrap: {
    width: "100%",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 8,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: semantic.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -0.5,
    textAlign: "center",
    maxWidth: "100%",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    textAlign: "center",
    maxWidth: "100%",
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: semantic.heroStart,
  },
  testimonialCardOuter: {
    width: "100%",
    alignSelf: "stretch",
  },
  testimonialCard: {
    backgroundColor: semantic.screenSurface,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: semantic.border,
    gap: 6,
    minHeight: 72,
    width: "100%",
  },
  testimonialText: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: font.regular,
    color: semantic.textPrimary,
    textAlign: "center",
    fontStyle: "italic",
    width: "100%",
  },
  testimonialAuthor: {
    fontSize: 13,
    fontFamily: font.medium,
    color: semantic.textSecondary,
    textAlign: "center",
    width: "100%",
  },

  revealContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: -40,
  },
  ringContainer: {
    width: RING_SIZE + 24,
    height: RING_SIZE + 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  photoRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3.5,
    borderColor: "rgba(255, 105, 86, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6956",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
    backgroundColor: semantic.appBackground,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
  },
  photoAbsolute: {
    position: "absolute",
  },
  sparkleFloat: {
    position: "absolute",
  },
  revealTitle: {
    fontSize: 40,
    fontWeight: "800",
    fontFamily: font.extraBold,
    color: semantic.textPrimary,
    letterSpacing: -1,
    textAlign: "center",
  },
  revealDescription: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  revealBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: semantic.accentSoft,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  revealBadgeText: {
    fontSize: 15,
    fontFamily: font.semiBold,
    color: semantic.textPrimary,
    letterSpacing: -0.2,
  },
  revealBadgeTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  footer: {
    paddingTop: spacing.md,
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
  startButton: {
    borderRadius: radius.lg,
    backgroundColor: semantic.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    fontFamily: font.bold,
  },
});
