import { useOnboardingStore } from "@state/useOnboardingStore";
export const useOnboarding = () => { const { currentStep, setCurrentStep } = useOnboardingStore(); return { currentStep, setCurrentStep }; };
