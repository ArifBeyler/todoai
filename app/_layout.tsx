import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_900Black,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_700Bold_Italic,
} from "@expo-google-fonts/playfair-display";
import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
  SpaceMono_400Regular_Italic,
} from "@expo-google-fonts/space-mono";
import {
  Oswald_300Light,
  Oswald_400Regular,
  Oswald_600SemiBold,
  Oswald_700Bold,
} from "@expo-google-fonts/oswald";
import { I18nProvider } from "@/src/providers/I18nProvider";
import { RevenueCatProvider } from "@/src/providers/RevenueCatProvider";
import { ensureAnonymousSession } from "@/src/services/supabase";
import { semantic } from "@/src/ui/tokens";
import "../global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  const [authReady, setAuthReady] = useState(false);

  const [fontsLoaded] = useFonts({
    // Inter ailesi
    "Inter-Thin": require("../assets/fonts/Inter/static/Inter_18pt-Thin.ttf"),
    "Inter-ThinItalic": require("../assets/fonts/Inter/static/Inter_18pt-ThinItalic.ttf"),
    "Inter-Light": require("../assets/fonts/Inter/static/Inter_18pt-Light.ttf"),
    "Inter-LightItalic": require("../assets/fonts/Inter/static/Inter_18pt-LightItalic.ttf"),
    "Inter-Regular": require("../assets/fonts/Inter/static/Inter_18pt-Regular.ttf"),
    "Inter-Italic": require("../assets/fonts/Inter/static/Inter_18pt-Italic.ttf"),
    "Inter-Medium": require("../assets/fonts/Inter/static/Inter_18pt-Medium.ttf"),
    "Inter-MediumItalic": require("../assets/fonts/Inter/static/Inter_18pt-MediumItalic.ttf"),
    "Inter-SemiBold": require("../assets/fonts/Inter/static/Inter_18pt-SemiBold.ttf"),
    "Inter-SemiBoldItalic": require("../assets/fonts/Inter/static/Inter_18pt-SemiBoldItalic.ttf"),
    "Inter-Bold": require("../assets/fonts/Inter/static/Inter_18pt-Bold.ttf"),
    "Inter-BoldItalic": require("../assets/fonts/Inter/static/Inter_18pt-BoldItalic.ttf"),
    "Inter-ExtraBold": require("../assets/fonts/Inter/static/Inter_18pt-ExtraBold.ttf"),
    "Inter-ExtraBoldItalic": require("../assets/fonts/Inter/static/Inter_18pt-ExtraBoldItalic.ttf"),
    "Inter-Black": require("../assets/fonts/Inter/static/Inter_18pt-Black.ttf"),
    "Inter-BlackItalic": require("../assets/fonts/Inter/static/Inter_18pt-BlackItalic.ttf"),
    // Playfair Display — zarifelegant serif
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_900Black,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold_Italic,
    // Bebas Neue — bold condensed display
    BebasNeue_400Regular,
    // Pacifico — eğlenceli cursive
    Pacifico_400Regular,
    // Space Mono — monospace
    SpaceMono_400Regular,
    SpaceMono_700Bold,
    SpaceMono_400Regular_Italic,
    // Oswald — condensed sans
    Oswald_300Light,
    Oswald_400Regular,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  useEffect(() => {
    ensureAnonymousSession().finally(() => setAuthReady(true));
  }, []);

  if (!authReady || !fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: semantic.appBackground,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={semantic.heroStart} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <RevenueCatProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="ai-assistant" options={{ presentation: "card" }} />
                <Stack.Screen name="paywall" options={{ gestureEnabled: false }} />
                <Stack.Screen name="premium-bridge" options={{ gestureEnabled: false, animation: "fade" }} />
                <Stack.Screen name="profile-reveal" options={{ gestureEnabled: false, animation: "fade" }} />
                <Stack.Screen name="(onboarding)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="todo" />
                <Stack.Screen name="visual" options={{ presentation: "modal" }} />
                <Stack.Screen name="stats" />
              </Stack>
            </RevenueCatProvider>
          </I18nProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
