import { useCallback, useEffect, useState } from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
let requestRecordingPermissionsAsync: (() => Promise<{ granted: boolean }>) | null = null;
try {
  requestRecordingPermissionsAsync = require("expo-audio").requestRecordingPermissionsAsync;
} catch {}
import { Microphone, Waveform } from "phosphor-react-native";
import { SequentialTyping } from "@/src/components/SequentialTyping";
import { semantic, radius, spacing } from "@/src/ui/tokens";

type MicPermissionScreenProps = {
  onGranted: () => void;
  onSkipped: () => void;
};

const DEMO_PHRASES = [
  { text: '"markete saat 3 gibi giderim"', pauseBeforeMs: 400, pauseAfterMs: 600, style: {} },
  { text: '"köpek maması siparişi ver"', pauseBeforeMs: 200, pauseAfterMs: 600, style: {} },
  { text: '"yarın toplantıyı hatırlat"', pauseBeforeMs: 200, pauseAfterMs: 400, style: {} },
];

export const MicPermissionScreen = ({
  onGranted,
  onSkipped,
}: MicPermissionScreenProps) => {
  const [permissionError, setPermissionError] = useState(false);
  const pulseScale = useSharedValue(1);
  const waveOpacity = useSharedValue(0.3);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    waveOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000 }),
        withTiming(0.2, { duration: 1000 }),
      ),
      -1,
      true,
    );
  }, [pulseScale, waveOpacity]);

  const micPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    opacity: waveOpacity.value,
  }));

  const handleRequest = useCallback(async () => {
    try {
      if (!requestRecordingPermissionsAsync) {
        setPermissionError(true);
        return;
      }
      const { granted } = await requestRecordingPermissionsAsync();
      if (granted) {
        onGranted();
      } else {
        setPermissionError(true);
      }
    } catch {
      setPermissionError(true);
    }
  }, [onGranted]);

  const handleOpenSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.micSection}>
        <Animated.View style={[styles.waveRing, styles.waveOuter, waveStyle]} />
        <Animated.View style={[styles.waveRing, styles.waveMiddle, waveStyle]} />
        <Animated.View style={[styles.micCircle, micPulseStyle]}>
          <Microphone size={36} color="#FFFFFF" weight="fill" />
        </Animated.View>
      </Animated.View>

      <Animated.Text entering={FadeInUp.delay(600).duration(500)} style={styles.headline}>
        Sesini duy, görevini oluştur
      </Animated.Text>

      <Animated.Text entering={FadeInUp.delay(800).duration(500)} style={styles.description}>
        Konuşarak görev ekle. Yapay zeka seni anlasın.
      </Animated.Text>

      <Animated.View entering={FadeInUp.delay(1200).duration(500)} style={styles.demoCard}>
        <View style={styles.demoIconRow}>
          <Waveform size={16} color={semantic.accent} weight="fill" />
          <Text style={styles.demoLabel}>Örnek komutlar</Text>
        </View>
        <SequentialTyping
          lines={DEMO_PHRASES}
          charDelayMs={32}
          showCursor
          containerStyle={styles.typingContainer}
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(2000).duration(400)} style={styles.ctaSection}>
        {permissionError ? (
          <>
            <Text style={styles.errorText}>
              Mikrofon izni reddedildi. Ayarlardan izin verebilirsin.
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleOpenSettings}
              activeOpacity={0.88}
              accessibilityRole="button"
            >
              <Text style={styles.ctaText}>Ayarları Aç</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleRequest}
            activeOpacity={0.88}
            accessibilityRole="button"
          >
            <Microphone size={20} color="#FFFFFF" weight="fill" />
            <Text style={styles.ctaText}>Mikrofonu Etkinleştir</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={onSkipped}
          activeOpacity={0.85}
          accessibilityRole="button"
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Şimdilik Atla</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.appBackground,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  micSection: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: semantic.accent,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  waveRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: semantic.accent,
  },
  waveOuter: {
    width: 130,
    height: 130,
  },
  waveMiddle: {
    width: 105,
    height: 105,
  },
  headline: {
    fontSize: 26,
    fontWeight: "800",
    color: "#3A2E28",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: "#8A7A70",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 24,
  },
  demoCard: {
    width: "100%",
    borderRadius: radius.xl,
    backgroundColor: "#FDFAF6",
    padding: spacing.md,
    gap: spacing.sm,
  },
  demoIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  demoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8A7A70",
  },
  typingContainer: {
    minHeight: 100,
  },
  ctaSection: {
    width: "100%",
    gap: 14,
    marginTop: spacing.sm,
  },
  ctaButton: {
    backgroundColor: semantic.accent,
    borderRadius: radius.xl,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 14,
    color: "#C86A62",
    fontWeight: "500",
    textAlign: "center",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  skipText: {
    color: "#8A7A70",
    fontSize: 15,
    fontWeight: "600",
  },
});
