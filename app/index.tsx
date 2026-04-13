import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Redirect } from "expo-router";
import { useSessionStore, isSessionHydrated } from "@state/useSessionStore";
import { isFTUEHydrated, useFTUEStore } from "@state/useFTUEStore";
import { font, semantic } from "@/src/ui/tokens";

const LOGO = require("../assets/icon.png");

const MIN_SPLASH_MS = 2000;

export default function IndexScreen() {
  const [hydrated, setHydrated] = useState(
    isFTUEHydrated() && isSessionHydrated(),
  );
  const [splashDone, setSplashDone] = useState(false);
  const [ready, setReady] = useState(false);

  const { onboardingCompleted } = useSessionStore();

  const logoScale = useSharedValue(0.9);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 500 });
    logoScale.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.96, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  useEffect(() => {
    if (hydrated) return;
    const check = setInterval(() => {
      if (isFTUEHydrated() && isSessionHydrated()) {
        setHydrated(true);
        clearInterval(check);
      }
    }, 50);
    const timeout = setTimeout(() => {
      setHydrated(true);
      clearInterval(check);
    }, 2000);
    return () => {
      clearInterval(check);
      clearTimeout(timeout);
    };
  }, [hydrated]);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated && splashDone) {
      if (!onboardingCompleted) {
        useFTUEStore.getState().resetOnboardingMidpoint();
      }
      setReady(true);
    }
  }, [hydrated, splashDone, onboardingCompleted]);

  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  if (!ready) {
    return (
      <View style={styles.splashContainer}>
        <Animated.View style={[styles.logoWrap, logoAnimStyle]}>
          <Image source={LOGO} style={styles.logo} />
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(400).duration(500)}
          style={styles.brandName}
        >
          Doara
        </Animated.Text>

        <Animated.Text
          entering={FadeIn.delay(700).duration(400)}
          style={styles.tagline}
        >
          Görevlerin, senin hikâyen.
        </Animated.Text>
      </View>
    );
  }

  if (onboardingCompleted) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(onboarding)/welcome" />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: semantic.appBackground,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },
  logoWrap: {
    width: 120,
    height: 120,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  brandName: {
    fontSize: 36,
    fontWeight: "900",
    fontFamily: font.black,
    color: semantic.textPrimary,
    letterSpacing: -1.2,
  },
  tagline: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: font.regular,
    color: semantic.textSecondary,
  },
});
