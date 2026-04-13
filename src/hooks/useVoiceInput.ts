import { useCallback, useState } from "react";
import { supabase } from "@/src/services/supabase";
import { parseTodoInput, type ParsedTodoInput } from "@/src/utils/parseTodoInput";

type VoiceInputState = {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string | null;
  parsedResult: ParsedTodoInput | null;
  error: string | null;
  confidence: number;
};

const INITIAL_STATE: VoiceInputState = {
  isRecording: false,
  isProcessing: false,
  transcript: null,
  parsedResult: null,
  error: null,
  confidence: 0,
};

const isExpoAudioAvailable = (): boolean => {
  try {
    require("expo-audio");
    return true;
  } catch {
    return false;
  }
};

export const useVoiceInput = () => {
  const [state, setState] = useState<VoiceInputState>(INITIAL_STATE);
  const available = isExpoAudioAvailable();

  // Conditionally use the hook — safe because availability is constant at runtime
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const audioHooks = available ? require("expo-audio") : null;
  const recorder = available
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      audioHooks.useAudioRecorder(audioHooks.RecordingPresets.HIGH_QUALITY)
    : null;

  const checkPermission = useCallback(async (): Promise<boolean> => {
    if (!available || !audioHooks) return false;
    try {
      const { granted } = await audioHooks.getRecordingPermissionsAsync();
      if (granted) return true;
      const { granted: newGranted } = await audioHooks.requestRecordingPermissionsAsync();
      return newGranted;
    } catch {
      return false;
    }
  }, [available, audioHooks]);

  const startRecording = useCallback(async () => {
    if (!available || !recorder) {
      setState((prev) => ({ ...prev, error: "voice_not_available" }));
      return false;
    }

    const hasPermission = await checkPermission();
    if (!hasPermission) {
      setState((prev) => ({ ...prev, error: "mic_permission_denied" }));
      return false;
    }

    try {
      await recorder.record();
      setState({ ...INITIAL_STATE, isRecording: true });
      return true;
    } catch {
      setState((prev) => ({ ...prev, error: "recording_failed", isRecording: false }));
      return false;
    }
  }, [available, recorder, checkPermission]);

  const stopRecording = useCallback(async () => {
    setState((prev) => ({ ...prev, isRecording: false, isProcessing: true }));

    try {
      if (!recorder) {
        setState((prev) => ({ ...prev, isProcessing: false, error: "no_audio_file" }));
        return;
      }

      await recorder.stop();
      const uri = recorder.uri;

      if (!uri) {
        setState((prev) => ({ ...prev, isProcessing: false, error: "no_audio_file" }));
        return;
      }

      const formData = new FormData();
      formData.append("audio", { uri, type: "audio/m4a", name: "recording.m4a" } as unknown as Blob);
      formData.append("language", "tr");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState((prev) => ({ ...prev, isProcessing: false, error: "not_authenticated" }));
        return;
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/transcribe-voice`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        },
      );

      if (!response.ok) {
        setState((prev) => ({ ...prev, isProcessing: false, error: "transcription_failed" }));
        return;
      }

      const result = await response.json();
      const transcript = result.transcript ?? "";

      if (!transcript.trim()) {
        setState((prev) => ({ ...prev, isProcessing: false, error: "empty_transcript" }));
        return;
      }

      const parsed = parseTodoInput(transcript);
      setState({
        isRecording: false,
        isProcessing: false,
        transcript,
        parsedResult: parsed,
        error: null,
        confidence: result.confidence ?? 0,
      });
    } catch {
      setState((prev) => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        error: "transcription_error",
      }));
    }
  }, [recorder]);

  const cancelRecording = useCallback(async () => {
    try { await recorder?.stop(); } catch {}
    setState(INITIAL_STATE);
  }, [recorder]);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const getErrorMessage = (error: string | null): string => {
    if (!error) return "";
    const messages: Record<string, string> = {
      voice_not_available: "Ses girişi bu cihazda desteklenmiyor.",
      mic_permission_denied: "Mikrofon izni gerekli. Ayarlardan izin verebilirsin.",
      recording_failed: "Kayıt başlatılamadı. Tekrar dene.",
      no_audio_file: "Ses dosyası oluşturulamadı.",
      empty_transcript: "Ses algılanamadı, tekrar dene.",
      transcription_failed: "Ses tanıma başarısız. Tekrar dene.",
      transcription_error: "Bir hata oluştu. Tekrar dene.",
      not_authenticated: "Oturum gerekli.",
    };
    return messages[error] ?? "Bilinmeyen hata. Tekrar dene.";
  };

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
    checkPermission,
    getErrorMessage,
    isAvailable: available,
  };
};
