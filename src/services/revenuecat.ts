import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";
import { Platform } from "react-native";

const RC_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "";

const ENTITLEMENT_ID = "pro";

let isConfigured = false;

export const initializeRevenueCat = async (
  supabaseUserId?: string,
): Promise<boolean> => {
  if (isConfigured) return true;

  const apiKey = Platform.select({ ios: RC_IOS_KEY, android: "" }) ?? "";
  if (!apiKey) return false;

  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
    await Purchases.configure({ apiKey });
    isConfigured = true;

    if (supabaseUserId) {
      await Purchases.logIn(supabaseUserId);
    }

    return true;
  } catch {
    return false;
  }
};

export const loginRevenueCat = async (supabaseUserId: string) => {
  try {
    const { customerInfo } = await Purchases.logIn(supabaseUserId);
    return customerInfo;
  } catch {
    return null;
  }
};

export const logoutRevenueCat = async () => {
  try {
    const info = await Purchases.logOut();
    return info;
  } catch {
    return null;
  }
};

export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch {
    return null;
  }
};

export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
};

export const purchasePackage = async (
  pkg: PurchasesPackage,
): Promise<{ success: boolean; customerInfo: CustomerInfo | null; cancelled: boolean }> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo, cancelled: false };
  } catch (error: unknown) {
    const isCancelled =
      typeof error === "object" &&
      error !== null &&
      "userCancelled" in error &&
      (error as { userCancelled: boolean }).userCancelled === true;

    return { success: false, customerInfo: null, cancelled: isCancelled };
  }
};

export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  try {
    return await Purchases.restorePurchases();
  } catch {
    return null;
  }
};

export const checkProEntitlement = (info: CustomerInfo): boolean => {
  return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
};

export const getSubscriptionPlanType = (
  info: CustomerInfo,
): "weekly" | "monthly" | "yearly" | null => {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  if (!entitlement) return null;

  const productId = entitlement.productIdentifier;
  if (productId.includes("weekly")) return "weekly";
  if (productId.includes("monthly")) return "monthly";
  if (productId.includes("yearly") || productId.includes("annual")) return "yearly";
  return null;
};

export const getExpirationDate = (info: CustomerInfo): Date | null => {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  if (!entitlement?.expirationDate) return null;
  return new Date(entitlement.expirationDate);
};

export const isInTrial = (info: CustomerInfo): boolean => {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  if (!entitlement) return false;
  return entitlement.periodType === "TRIAL";
};

export const addCustomerInfoListener = (
  listener: (info: CustomerInfo) => void,
): (() => void) => {
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
};
