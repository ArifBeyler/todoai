import { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Microphone, MicrophoneSlash, Waveform } from "phosphor-react-native";
import { font, radius, semantic, shadow, spacing } from "@/src/ui/tokens";
import { preHomeMotion } from "@/src/ui/motion";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import {
  OnboardingStaggeredParagraph,
  countStaggerSteps,
} from "@/src/components/OnboardingStaggeredText";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";
import { useFTUEStore } from "@/src/state/useFTUEStore";

let requestRecordingPermissionsAsync: (() => Promise<{ granted: boolean }>) | null = null;
try {
  requestRecordingPermissionsAsync = require("expo-audio").requestRecordingPermissionsAsync;
} catch {}

const VOICE_EXAMPLES = [
  '"Markete saat 3 gibi giderim"',
  '"Köpek maması siparişi ver"',
  '"Yarın toplantıyı hatırlat"',
];

export default function MicrophoneOnboardingScreen() {
  const setNotificationPermission = useFTUEStore((s) => s.setNotificationPermission);
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const { triggerExit, exitStyle } = useOnboardingExit();

  const pulseScale = useSharedValue(1);
  const waveOpacity = useSharedValue(0.25);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    waveOpacity.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 950 }),
        withTiming(0.15, { duration: 950 }),
      ),
      -1,
      true,
    );
  }, []);

  const micPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  const waveStyle = useAnimatedStyle(() => ({ opacity: waveOpacity.value }));

  const goNext = useCallback(() => {
    triggerExit("forward", () => router.push("/paywall?mode=soft"));
  }, [triggerExit]);

  const handleAllow = useCallback(async () => {
    if (isRequesting || !requestRecordingPermissionsAsync) {
      goNext();
      return;
    }
    setIsRequesting(true);
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (granted) {
        useFTUEStore.getState().setNotificationPermission("granted");
      } else {
        setPermissionDenied(true);
      }
    } catch {
      setPermissionDenied(true);
    } finally {
      setIsRequesting(false);
      goNext();
    }
  }, [isRequesting, goNext]);

  const handleSkip = useCallback(() => {
    goNext();
  }, [goNext]);

  const handleBack = useCallback(() => {
    triggerExit("back", () => router.back());
  }, [triggerExit]);

  const handleOpenSettings = () => {
    if (Platform.OS === "ios") Linking.openURL("app-settings:");
  };

  const titleText = "Sesini duy,\ngörevi oluştur";
  const subText =
    "Konuşarak görev ekle. Yapay zeka seni anlasın, not almana gerek kalmadan.";

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      {/* Mic icon with pulse rings */}
      <Animated.View
        entering={preHomeMotion.screenEnter}
        style={styles.iconArea}
      >
        <Animated.View style={[styles.waveRing, styles.waveOuter, waveStyle]} />
        <Animated.View style={[styles.waveRing, styles.waveInner, waveStyle]} />
        <Animated.View style={[styles.micCircle, micPulseStyle]}>
          <Microphone size={44} color={semantic.textOnDark} weight="fill" />
        </Animated.View>
      </Animated.View>

      {/* Title + subtitle */}
      <Animated.View entering={preHomeMotion.sectionEnter(140)}>
        <OnboardingStaggeredParagraph
          text={titleText}
          style={styles.title}
          startDelay={160}
          staggerMs={22}
        />
        <OnboardingStaggeredParagraph
          text={subText}
          style={styles.sub}
          startDelay={160 + countStaggerSteps(titleText) * 22 + 50}
          staggerMs={15}
          containerStyle={styles.subSpacing}
        />
      </Animated.View>

      {/* Example commands card */}
      <Animated.View entering={FadeIn.delay(560).duration(350)} style={[styles.examplesCard, shadow.card]}>
        <View style={styles.examplesHeader}>
          <Waveform size={15} color={semantic.accent} weight="fill" />
          <Text style={styles.examplesLabel}>Örnek komutlar</Text>
        </View>
        {VOICE_EXAMPLES.map((example, i) => (
          <View key={i} style={styles.exampleRow}>
            <View style={styles.exampleDot} />
            <Text style={styles.exampleText}>{example}</Text>
          </View>
        ))}
      </Animated.View>

      {/* CTA */}
      <Animated.View entering={preHomeMotion.ctaEnter(680)} style={styles.footer}>
        {permissionDenied ? (
          <>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleOpenSettings}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Microphone size={18} color={semantic.textOnDark} weight="fill" />
              <Text style={styles.settingsButtonText}>Ayarlardan İzin Ver</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={styles.skipButtonText}>Şimdilik Atla</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <OnboardingFooter
              onNext={handleAllow}
              onBack={handleBack}
              nextLabel={isRequesting ? "İzin isteniyor…" : "Mikrofonu Etkinleştir"}
              nextDisabled={isRequesting}
              showBack
            />
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Şimdilik atla"
            >
              <MicrophoneSlash size={16} color={semantic.textSecondary} />
              <Text style={styles.skipButtonText}>Şimdilik Atla</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F0",
    paddingHorizontal: spacing.xl,
    paddingTop: 90,
    paddingBottom: 52,
  },
  iconArea: {
    alignSelf: "center",
    marginBottom: spacing.xl,
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  micCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  waveRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: semantic.heroStart,
  },
  waveOuter: {
    width: 118,
    height: 118,
  },
  waveInner: {
    width: 103,
    height: 103,
  },
  title: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -0.8,
  },
  sub: {
    fontSize: 15,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    lineHeight: 22,
  },
  subSpacing: {
    marginTop: spacing.xs,
  },
  examplesCard: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: semantic.border,
    backgroundColor: semantic.screenSurface,
    padding: spacing.md,
    gap: spacing.xs,
  },
  examplesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.xs,
  },
  examplesLabel: {
    fontSize: 12,
    fontFamily: font.semiBold,
    fontWeight: "600",
    color: semantic.textSecondary,
    letterSpacing: 0.3,
  },
  exampleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 4,
  },
  exampleDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: semantic.accent,
  },
  exampleText: {
    fontSize: 15,
    fontFamily: font.regular,
    color: semantic.textPrimary,
    lineHeight: 22,
  },
  footer: {
    marginTop: "auto",
    gap: spacing.sm,
  },
  settingsButton: {
    borderRadius: radius.lg,
    backgroundColor: semantic.heroStart,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
    gap: 8,
    ...shadow.soft,
  },
  settingsButtonText: {
    color: semantic.textOnDark,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: font.bold,
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
  },
  skipButtonText: {
    color: semantic.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: font.semiBold,
  },
});
