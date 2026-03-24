import {
  useSessionStore,
  isTrialActive,
  trialDaysRemaining,
} from "@state/useSessionStore";
import { useFTUEStore } from "@state/useFTUEStore";

export const useRevenueCat = () => {
  const { isPremium, startTrial, trialStartedAt, trialDurationDays } =
    useSessionStore();
  const markSubscribed = useFTUEStore((s) => s.markSubscribed);

  const trialActive = isTrialActive(trialStartedAt, trialDurationDays);
  const daysRemaining = trialDaysRemaining(trialStartedAt, trialDurationDays);

  const purchaseTrial = async () => {
    startTrial();
    markSubscribed();
    return { success: true };
  };

  const purchasePremium = async () => {
    useSessionStore.getState().setPremium(true);
    markSubscribed();
    return { success: true };
  };

  const restorePurchases = async () => {
    return { success: false };
  };

  return {
    isPremium,
    trialActive,
    daysRemaining,
    purchaseTrial,
    purchasePremium,
    restorePurchases,
  };
};
