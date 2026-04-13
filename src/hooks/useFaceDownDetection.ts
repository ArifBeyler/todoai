import { useCallback, useEffect, useRef, useState } from "react";
import { Accelerometer, type AccelerometerMeasurement } from "expo-sensors";
import { AppState, type AppStateStatus } from "react-native";

const FACE_DOWN_THRESHOLD = 8.5;
const FLIP_GRACE_MS = 5000;
const APP_BACKGROUND_GRACE_MS = 30000;
const UPDATE_INTERVAL_MS = 1000;

type FaceDownState = {
  isFaceDown: boolean;
  isInterrupted: boolean;
  interruptionCount: number;
  isAvailable: boolean;
};

export const useFaceDownDetection = (enabled: boolean, isSessionActive: boolean) => {
  const [state, setState] = useState<FaceDownState>({
    isFaceDown: false,
    isInterrupted: false,
    interruptionCount: 0,
    isAvailable: true,
  });

  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasFaceDownRef = useRef(false);
  const interruptCountRef = useRef(0);

  const handleInterruption = useCallback(() => {
    interruptCountRef.current += 1;
    setState((prev) => ({
      ...prev,
      isInterrupted: true,
      interruptionCount: interruptCountRef.current,
    }));
  }, []);

  const resetInterruption = useCallback(() => {
    setState((prev) => ({ ...prev, isInterrupted: false }));
  }, []);

  useEffect(() => {
    if (!enabled || !isSessionActive) return;

    let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;

    const setup = async () => {
      const available = await Accelerometer.isAvailableAsync();
      if (!available) {
        setState((prev) => ({ ...prev, isAvailable: false }));
        return;
      }

      Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);

      subscription = Accelerometer.addListener((data: AccelerometerMeasurement) => {
        const isFaceDown = data.z > FACE_DOWN_THRESHOLD;

        if (isFaceDown && !wasFaceDownRef.current) {
          wasFaceDownRef.current = true;
          if (flipTimerRef.current) {
            clearTimeout(flipTimerRef.current);
            flipTimerRef.current = null;
          }
          setState((prev) => ({ ...prev, isFaceDown: true }));
        } else if (!isFaceDown && wasFaceDownRef.current) {
          if (!flipTimerRef.current) {
            flipTimerRef.current = setTimeout(() => {
              wasFaceDownRef.current = false;
              setState((prev) => ({ ...prev, isFaceDown: false }));
              handleInterruption();
              flipTimerRef.current = null;
            }, FLIP_GRACE_MS);
          }
        }
      });
    };

    setup();

    return () => {
      subscription?.remove();
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    };
  }, [enabled, isSessionActive, handleInterruption]);

  useEffect(() => {
    if (!enabled || !isSessionActive) return;

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "background" || nextState === "inactive") {
        backgroundTimerRef.current = setTimeout(() => {
          handleInterruption();
        }, APP_BACKGROUND_GRACE_MS);
      } else if (nextState === "active") {
        if (backgroundTimerRef.current) {
          clearTimeout(backgroundTimerRef.current);
          backgroundTimerRef.current = null;
        }
      }
    };

    const sub = AppState.addEventListener("change", handleAppState);

    return () => {
      sub.remove();
      if (backgroundTimerRef.current) clearTimeout(backgroundTimerRef.current);
    };
  }, [enabled, isSessionActive, handleInterruption]);

  const reset = useCallback(() => {
    interruptCountRef.current = 0;
    wasFaceDownRef.current = false;
    setState({
      isFaceDown: false,
      isInterrupted: false,
      interruptionCount: 0,
      isAvailable: state.isAvailable,
    });
  }, [state.isAvailable]);

  return { ...state, resetInterruption, reset };
};
