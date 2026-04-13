import { useCallback, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useAIVisualStore, PROFILE_GENERATION_MESSAGES, PROFILE_GENERATION_TIMEOUT } from "@state/useAIVisualStore";
import { useFTUEStore } from "@state/useFTUEStore";
import { useSessionStore } from "@state/useSessionStore";
import { supabase } from "@/src/services/supabase";

const POLL_INTERVAL_MS = 4_000;

type UseProfileGenerationReturn = {
  profileGenerationState: ReturnType<typeof useAIVisualStore.getState>["profileGenerationState"];
  progressMessage: string;
  isTimedOut: boolean;
  isDelayed: boolean;
  startPolling: () => void;
  stopPolling: () => void;
};

/**
 * Manages the full lifecycle of first-time profile photo generation:
 * - Tracks states: uploading → validating → queued → generating → ready | failed | delayed
 * - Enforces a 90-second hard timeout → transitions to "delayed"
 * - When ready, schedules a local notification and triggers the profile reveal flow
 * - Polls get-home-state to detect when the backend avatar is done
 */
export const useProfileGeneration = (): UseProfileGenerationReturn => {
  const {
    profileGenerationState,
    profileGenerationStartedAt,
    setProfileGenerationState,
    completeProfileGeneration,
    failProfileGeneration,
    timeoutProfileGeneration,
  } = useAIVisualStore();

  const { setAvatarStatus } = useFTUEStore();
  const { setGeneratedAvatarUrl } = useSessionStore();

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasResolvedRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const stopTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleProfileReady = useCallback(
    async (avatarUrl: string) => {
      if (hasResolvedRef.current) return;
      hasResolvedRef.current = true;

      stopPolling();
      stopTimeout();

      // Store separately so profile-reveal.tsx can animate original → generated.
      // profilePhoto is updated only when the user confirms the reveal screen.
      setGeneratedAvatarUrl(avatarUrl);
      setAvatarStatus("ready");
      completeProfileGeneration();

      // Notify the user their first profile visual is ready
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Profilin hazır! ✨",
            body: "Artık görsellerin sana özel üretilecek. Hemen bak!",
            data: { type: "profile_ready" },
            sound: "default",
          },
          trigger: null, // immediate
        });
      } catch {
        // Silent — notification is non-critical
      }
    },
    [stopPolling, stopTimeout, setGeneratedAvatarUrl, setAvatarStatus, completeProfileGeneration],
  );

  const pollAvatarStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-home-state", {
        body: {},
      });
      if (error || !data) return;

      const avatarUrl =
        data.avatarSummary?.signedUrl ??
        data.avatarSummary?.imageUrl ??
        null;

      if (avatarUrl && data.avatarSummary?.id) {
        await handleProfileReady(avatarUrl);
        return;
      }

      // Advance through intermediate states based on backend signals
      const serverAvatarStatus = data.avatarSummary?.status as string | undefined;
      if (serverAvatarStatus === "queued" && profileGenerationState === "uploading") {
        setProfileGenerationState("queued");
      } else if (
        (serverAvatarStatus === "generating" || serverAvatarStatus === "processing") &&
        profileGenerationState !== "generating"
      ) {
        setProfileGenerationState("generating");
      } else if (serverAvatarStatus === "failed") {
        stopPolling();
        stopTimeout();
        failProfileGeneration();
      }
    } catch {
      // Silent — keep polling
    }
  }, [
    profileGenerationState,
    setProfileGenerationState,
    failProfileGeneration,
    handleProfileReady,
    stopPolling,
    stopTimeout,
  ]);

  const startPolling = useCallback(() => {
    hasResolvedRef.current = false;
    stopPolling();

    // Transition through initial states
    setProfileGenerationState("validating");

    setTimeout(() => {
      if (!hasResolvedRef.current) setProfileGenerationState("queued");
    }, 3_000);

    setTimeout(() => {
      if (!hasResolvedRef.current) setProfileGenerationState("generating");
    }, 8_000);

    pollingRef.current = setInterval(pollAvatarStatus, POLL_INTERVAL_MS);

    // 90-second hard timeout
    timeoutRef.current = setTimeout(() => {
      if (!hasResolvedRef.current) {
        timeoutProfileGeneration();
        stopPolling();
      }
    }, PROFILE_GENERATION_TIMEOUT);
  }, [
    stopPolling,
    setProfileGenerationState,
    pollAvatarStatus,
    timeoutProfileGeneration,
  ]);

  // If we're in "delayed" state and the backend eventually delivers the avatar,
  // we resume polling briefly to catch late completion.
  useEffect(() => {
    if (profileGenerationState === "delayed" && !pollingRef.current) {
      pollingRef.current = setInterval(async () => {
        if (hasResolvedRef.current) {
          stopPolling();
          return;
        }
        await pollAvatarStatus();
      }, 15_000); // slower polling for delayed state
    }
    return () => {
      // Cleanup only on unmount
    };
  }, [profileGenerationState, pollAvatarStatus, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      stopTimeout();
    };
  }, [stopPolling, stopTimeout]);

  const progressMessage = PROFILE_GENERATION_MESSAGES[profileGenerationState] ?? "";
  const isTimedOut = profileGenerationState === "delayed" || profileGenerationState === "failed";
  const isDelayed = profileGenerationState === "delayed";

  return {
    profileGenerationState,
    progressMessage,
    isTimedOut,
    isDelayed,
    startPolling,
    stopPolling,
  };
};
