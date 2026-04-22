import { useCallback, useEffect, useState } from "react";
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import { useSessionStore } from "@state/useSessionStore";
import { useFTUEStore } from "@state/useFTUEStore";
import {
  getOfferings,
  getCustomerInfo,
  purchasePackage as rcPurchase,
  restorePurchases as rcRestore,
  checkProEntitlement,
  getSubscriptionPlanType,
  getExpirationDate,
  isInTrial,
  addCustomerInfoListener,
} from "@/src/services/revenuecat";

type PurchaseResult = {
  success: boolean;
  cancelled: boolean;
  error?: string;
};

export const useRevenueCat = () => {
  const setPremium = useSessionStore((s) => s.setPremium);
  const isPremium = useSessionStore((s) => s.isPremium);
  const markSubscribed = useFTUEStore((s) => s.markSubscribed);

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [offeringsError, setOfferingsError] = useState(false);
  const [isRefetchingOfferings, setIsRefetchingOfferings] = useState(false);

  const syncOfferingsFromResult = useCallback((current: PurchasesOffering | null) => {
    setOffering(current);
    const count = current?.availablePackages?.length ?? 0;
    setOfferingsError(count === 0);
  }, []);

  const syncPremiumState = useCallback(
    (info: CustomerInfo) => {
      setCustomerInfo(info);
      const hasPro = checkProEntitlement(info);
      setPremium(hasPro);
      if (hasPro) {
        markSubscribed();
      }
    },
    [setPremium, markSubscribed],
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const [info, currentOffering] = await Promise.all([
        getCustomerInfo(),
        getOfferings(),
      ]);

      if (!mounted) return;

      if (info) {
        syncPremiumState(info);
      }
      syncOfferingsFromResult(currentOffering);
      setIsLoading(false);
    };

    init();

    addCustomerInfoListener((info) => {
      if (mounted) {
        syncPremiumState(info);
      }
    });

    return () => {
      mounted = false;
    };
  }, [syncPremiumState, syncOfferingsFromResult]);

  const refetchOfferings = useCallback(async () => {
    setIsRefetchingOfferings(true);
    try {
      const currentOffering = await getOfferings();
      syncOfferingsFromResult(currentOffering);
    } finally {
      setIsRefetchingOfferings(false);
    }
  }, [syncOfferingsFromResult]);

  // Pulls the latest CustomerInfo from RevenueCat and syncs the local premium
  // state. Safe to call on screen focus, after purchase, on app resume, or on
  // the premium bridge — single source of truth for "am I premium right now?".
  const refreshEntitlement = useCallback(async () => {
    const info = await getCustomerInfo();
    if (info) {
      syncPremiumState(info);
    }
    return info;
  }, [syncPremiumState]);

  const packages = offering?.availablePackages ?? [];

  const planType = customerInfo ? getSubscriptionPlanType(customerInfo) : null;
  const expirationDate = customerInfo ? getExpirationDate(customerInfo) : null;
  const trialActive = customerInfo ? isInTrial(customerInfo) : false;

  const handlePurchase = useCallback(
    async (pkg: PurchasesPackage): Promise<PurchaseResult> => {
      if (isPurchasing) return { success: false, cancelled: false };
      setIsPurchasing(true);

      try {
        const result = await rcPurchase(pkg);

        if (result.success && result.customerInfo) {
          syncPremiumState(result.customerInfo);
          return { success: true, cancelled: false };
        }

        return {
          success: false,
          cancelled: result.cancelled,
          error: result.cancelled ? undefined : "purchase_failed",
        };
      } catch {
        return { success: false, cancelled: false, error: "unexpected_error" };
      } finally {
        setIsPurchasing(false);
      }
    },
    [isPurchasing, syncPremiumState],
  );

  const handleRestore = useCallback(async (): Promise<PurchaseResult> => {
    if (isRestoring) return { success: false, cancelled: false };
    setIsRestoring(true);

    try {
      const info = await rcRestore();
      if (info) {
        syncPremiumState(info);
        const hasPro = checkProEntitlement(info);
        return { success: hasPro, cancelled: false };
      }
      return { success: false, cancelled: false, error: "restore_failed" };
    } catch {
      return { success: false, cancelled: false, error: "unexpected_error" };
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring, syncPremiumState]);

  return {
    isPremium,
    isLoading,
    isPurchasing,
    isRestoring,
    offering,
    packages,
    offeringsError,
    isRefetchingOfferings,
    refetchOfferings,
    planType,
    expirationDate,
    trialActive,
    customerInfo,
    purchasePackage: handlePurchase,
    restorePurchases: handleRestore,
    refreshEntitlement,
  };
};
