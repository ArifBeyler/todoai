import { useSessionStore } from "@state/useSessionStore";
import { useFTUEStore } from "@state/useFTUEStore";

export const useAuth = () => {
  const { isAuthenticated, setAuthenticated, signOut: sessionSignOut } =
    useSessionStore();
  const resetFTUE = useFTUEStore((s) => s.resetFTUE);

  const signOut = () => {
    sessionSignOut();
    resetFTUE();
  };

  return { isAuthenticated, setAuthenticated, signOut };
};
