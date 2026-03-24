import { create } from "zustand";
export const useOnboardingStore = create<{ currentStep: number; setCurrentStep: (step: number) => void }>((set) => ({ currentStep: 0, setCurrentStep: (step) => set({ currentStep: step }) }));
