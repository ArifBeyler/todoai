import { Redirect } from "expo-router";
import { useSessionStore } from "@state/useSessionStore";
import { useFTUEStore } from "@state/useFTUEStore";

export default function IndexScreen() {
  const { isAuthenticated, onboardingCompleted } = useSessionStore();
  const { onboardingSlidesCompleted, accountGateCompleted } = useFTUEStore();

  if (!onboardingSlidesCompleted) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  if (!accountGateCompleted || !isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  if (!onboardingCompleted) {
    return <Redirect href="/(onboarding)/name" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
