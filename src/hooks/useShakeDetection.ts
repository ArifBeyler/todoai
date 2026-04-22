import { useEffect, useRef } from "react";
import { Accelerometer, type AccelerometerMeasurement } from "expo-sensors";

type ShakeOptions = {
  enabled: boolean;
  onShake: () => void;
  // Magnitude threshold in g. 1.8g is a gentle-but-deliberate shake.
  threshold?: number;
  // Minimum ms between consecutive fires so one shake doesn't trigger twice.
  debounceMs?: number;
  // Sensor polling interval in ms.
  sampleIntervalMs?: number;
};

const DEFAULT_THRESHOLD = 1.8;
const DEFAULT_DEBOUNCE = 700;
const DEFAULT_SAMPLE_INTERVAL = 80;

/**
 * Fires `onShake` when the phone is shaken past the threshold. Debounced so a
 * single physical shake only emits once. The caller owns the `enabled` flag so
 * the listener can be torn down (e.g. after the reveal).
 */
export const useShakeDetection = ({
  enabled,
  onShake,
  threshold = DEFAULT_THRESHOLD,
  debounceMs = DEFAULT_DEBOUNCE,
  sampleIntervalMs = DEFAULT_SAMPLE_INTERVAL,
}: ShakeOptions) => {
  const lastFireRef = useRef(0);
  const onShakeRef = useRef(onShake);

  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;

    const setup = async () => {
      const available = await Accelerometer.isAvailableAsync();
      if (cancelled || !available) return;

      Accelerometer.setUpdateInterval(sampleIntervalMs);

      subscription = Accelerometer.addListener(
        (data: AccelerometerMeasurement) => {
          const magnitude = Math.sqrt(
            data.x * data.x + data.y * data.y + data.z * data.z,
          );

          if (magnitude < threshold) return;

          const now = Date.now();
          if (now - lastFireRef.current < debounceMs) return;
          lastFireRef.current = now;

          onShakeRef.current();
        },
      );
    };

    setup();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled, threshold, debounceMs, sampleIntervalMs]);
};
