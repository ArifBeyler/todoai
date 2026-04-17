import { type ReactNode, useEffect, useRef } from "react";
import type { CustomerInfo } from "react-native-purchases";
import { useSessionStore } from "@state/useSessionStore";
import { useFTUEStore } from "@state/useFTUEStore";
import {
  initializeRevenueCat,
  loginRevenueCat,
  logoutRevenueCat,
  getCustomerInfo,
  checkProEntitlement,
  addCustomerInfoListener,
} from "@/src/services/revenuecat";
import { supabase } from "@/src/services/supabase";

export const RevenueCatProvider = ({ children }: { children: ReactNode }) => {
  const setPremium = useSessionStore((s) => s.setPremium);
  const markSubscribed = useFTUEStore((s) => s.markSubscribed);
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const handleCustomerInfoUpdate = (info: CustomerInfo) => {
      const hasPro = checkProEntitlement(info);
      setPremium(hasPro);
      if (hasPro) {
        markSubscribed();
      }
    };

    let removeCustomerInfoListener: (() => void) | null = null;

    const boot = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const ok = await initializeRevenueCat(userId ?? undefined);
      if (!ok || !mounted) return;

      if (userId) {
        prevUserId.current = userId;
        await loginRevenueCat(userId);
      }

      const info = await getCustomerInfo();
      if (info && mounted) {
        handleCustomerInfoUpdate(info);
      }

      // Capture unsubscribe function to call on cleanup
      removeCustomerInfoListener = addCustomerInfoListener((updatedInfo) => {
        if (mounted) handleCustomerInfoUpdate(updatedInfo);
      });
    };

    boot();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === "SIGNED_IN" && session?.user?.id) {
          const uid = session.user.id;
          if (prevUserId.current !== uid) {
            prevUserId.current = uid;
            await loginRevenueCat(uid);
            const info = await getCustomerInfo();
            if (info && mounted) handleCustomerInfoUpdate(info);
          }
        }

        if (event === "SIGNED_OUT") {
          prevUserId.current = null;
          await logoutRevenueCat();
          setPremium(false);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      removeCustomerInfoListener?.();
    };
  }, [setPremium, markSubscribed]);

  return <>{children}</>;
};
