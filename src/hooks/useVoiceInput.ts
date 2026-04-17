import { useCallback, useState } from "react";
import {
  useAudioRecorder,
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import * as FileSystem from "expo-file-system";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "@/src/services/supabase";
import type { ParsedTodoInput } from "@/src/utils/parseTodoInput";
import { parseTodoInputsWithLLM } from "@/src/utils/parseTodoInputLLM";

const TRANSCRIBE_TIMEOUT_MS = 30_000;
// Minimum audio file size in bytes — anything below this is likely an empty
// simulator recording (M4A header only, no audio frames).
const MIN_AUDIO_BYTES = 1_000;

const isSimulator = Platform.OS === "ios" && !Constants.isDevice;

type VoiceInputState = {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string | null;
  parsedResult: ParsedTodoInput | null;
  parsedResults: ParsedTodoInput[] | null;
  error: string | null;
  confidence: number;
};

const INITIAL_STATE: VoiceInputState = {
  isRecording: false,
  isProcessing: false,
  transcript: null,
  parsedResult: null,
  parsedResults: null,
  error: null,
  confidence: 0,
};

export const useVoiceInput = () => {
  const [state, setState] = useState<VoiceInputState>(INITIAL_STATE);

  // Always call unconditionally — React Rules of Hooks
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { granted } = await getRecordingPermissionsAsync();
      if (granted) return true;
      const { granted: newGranted } = await requestRecordingPermissionsAsync();
      console.log("[VoiceInput] İzin istendi, sonuç:", newGranted);
      return newGranted;
    } catch (e) {
      console.error("[VoiceInput] ❌ checkPermission exception:", e);
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    // Warn early — simulator has no real mic, audio file will be empty
    if (isSimulator) {
      console.warn(
        "[VoiceInput] ⚠️  SIMULATOR: Gerçek mikrofon yok. Ses dosyası boş üretilecek. " +
        "Gerçek iPhone ile test et.",
      );
      setState((prev) => ({ ...prev, error: "simulator_no_mic" }));
      return false;
    }

    const hasPermission = await checkPermission();
    if (!hasPermission) {
      console.error("[VoiceInput] ❌ Mikrofon izni reddedildi.");
      setState((prev) => ({ ...prev, error: "mic_permission_denied" }));
      return false;
    }

    try {
      // expo-audio: session must be set before prepareToRecordAsync or record() throws
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
      await recorder.prepareToRecordAsync();
      // record() returns void — do NOT wrap in Promise.resolve / await
      recorder.record();
      setState({ ...INITIAL_STATE, isRecording: true });
      console.log("[VoiceInput] ✅ Kayıt başladı.");
      return true;
    } catch (e) {
      console.error("[VoiceInput] ❌ startRecording exception:", e);
      setState((prev) => ({ ...prev, error: "recording_failed", isRecording: false }));
      return false;
    }
  }, [recorder, checkPermission]);

  const stopRecording = useCallback(async () => {
    setState((prev) => ({ ...prev, isRecording: false, isProcessing: true }));

    try {
      await recorder.stop();
      const uri = recorder.uri;

      console.log("[VoiceInput] recorder.stop() tamamlandı. URI:", uri ?? "(null)");

      if (!uri) {
        console.error("[VoiceInput] ❌ URI null — recorder.stop() sonrası dosya yok.");
        setState((prev) => ({ ...prev, isProcessing: false, error: "no_audio_file" }));
        return;
      }

      // ── File size validation ────────────────────────────────────────────────
      let fileSize = 0;
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        fileSize = fileInfo.exists ? ((fileInfo as { size?: number }).size ?? 0) : 0;
        console.log(
          "[VoiceInput] Dosya boyutu:", fileSize, "bytes | Exists:", fileInfo.exists,
        );
      } catch (fsErr) {
        console.warn("[VoiceInput] FileSystem.getInfoAsync başarısız:", fsErr);
        // Non-fatal — devam et, backend kendi kontrolünü yapacak
      }

      if (fileSize > 0 && fileSize < MIN_AUDIO_BYTES) {
        console.error(
          "[VoiceInput] ❌ Dosya çok küçük:", fileSize,
          "bytes (min:", MIN_AUDIO_BYTES, "). Simülatör veya boş kayıt.",
        );
        setState((prev) => ({ ...prev, isProcessing: false, error: "recording_too_short" }));
        return;
      }

      // ── FormData ───────────────────────────────────────────────────────────
      const formData = new FormData();
      formData.append("audio", { uri, type: "audio/m4a", name: "recording.m4a" } as unknown as Blob);
      formData.append("language", "tr");

      // ── Session / auth ─────────────────────────────────────────────────────
      let { data: { session } } = await supabase.auth.getSession();

      // Force refresh if token is missing or within 2 minutes of expiry
      if (!session || (session.expires_at && session.expires_at - Math.floor(Date.now() / 1000) < 120)) {
        console.log("[VoiceInput] Token süresi yakın, yenileniyor...");
        const { data: refreshed } = await supabase.auth.refreshSession();
        session = refreshed.session;
      }

      if (!session) {
        console.error("[VoiceInput] ❌ Oturum alınamadı (null session).");
        setState((prev) => ({ ...prev, isProcessing: false, error: "not_authenticated" }));
        return;
      }

      console.log(
        "[VoiceInput] 📤 Upload başlıyor. Dosya:", fileSize, "bytes |",
        "Token expires_at:", session.expires_at,
        "| URL:", `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/transcribe-voice`,
      );

      // ── HTTP request ───────────────────────────────────────────────────────
      const transcribeWithToken = async (accessToken: string): Promise<Response> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TRANSCRIBE_TIMEOUT_MS);
        try {
          return await fetch(
            `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/transcribe-voice`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${accessToken}` },
              body: formData,
              signal: controller.signal,
            },
          );
        } finally {
          clearTimeout(timeoutId);
        }
      };

      let response: Response;
      try {
        response = await transcribeWithToken(session.access_token);
        console.log("[VoiceInput] HTTP yanıtı:", response.status, response.statusText);

        // 401 → token was still stale; force refresh once and retry
        if (response.status === 401) {
          console.warn("[VoiceInput] 401 alındı, token yenileniyor ve tekrar deneniyor...");
          const { data: retryRefresh } = await supabase.auth.refreshSession();
          if (!retryRefresh.session) {
            setState((prev) => ({ ...prev, isProcessing: false, error: "not_authenticated" }));
            return;
          }
          response = await transcribeWithToken(retryRefresh.session.access_token);
          console.log("[VoiceInput] Retry HTTP yanıtı:", response.status, response.statusText);
        }
      } catch (fetchErr) {
        const isTimeout = fetchErr instanceof Error && fetchErr.name === "AbortError";
        console.error(
          "[VoiceInput] ❌ Fetch exception:",
          isTimeout ? "TIMEOUT" : fetchErr,
        );
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: isTimeout ? "transcription_timeout" : "upload_failed",
        }));
        return;
      }

      // ── Error response handling ─────────────────────────────────────────────
      if (!response.ok) {
        let errorCode = "transcription_failed";
        try {
          const errBody = await response.json();
          console.error(
            "[VoiceInput] ❌ Backend hata yanıtı:",
            response.status,
            JSON.stringify(errBody),
          );
          if (errBody?.detail) {
            console.error("[VoiceInput] FAL/backend detay:", errBody.detail);
          }
          if (errBody?.error === "empty_transcript") errorCode = "empty_transcript";
          else if (errBody?.error === "audio_too_large") errorCode = "audio_too_large";
          else if (errBody?.error === "audio_too_short") errorCode = "recording_too_short";
          else if (errBody?.error === "stt_not_configured") errorCode = "stt_not_configured";
          else if (errBody?.error === "transcription_failed") {
            // FAL Whisper veya ElevenLabs başarısız — detail loglandı, genel mesaj göster
            errorCode = "fal_error";
          }
        } catch (parseErr) {
          console.error("[VoiceInput] ❌ Error body parse edilemedi:", parseErr);
        }
        setState((prev) => ({ ...prev, isProcessing: false, error: errorCode }));
        return;
      }

      // ── Success ────────────────────────────────────────────────────────────
      const result = await response.json();
      const transcript = result.transcript ?? "";
      console.log(
        "[VoiceInput] ✅ Transcript alındı. Uzunluk:", transcript.length,
        "Confidence:", result.confidence,
      );

      if (!transcript.trim()) {
        console.warn("[VoiceInput] Transcript boş — empty_transcript.");
        setState((prev) => ({ ...prev, isProcessing: false, error: "empty_transcript" }));
        return;
      }

      console.log("[VoiceInput] LLM parse başlıyor...");
      const results = await parseTodoInputsWithLLM(transcript, "tr");
      console.log("[VoiceInput] ✅ Parse tamamlandı. Görev sayısı:", results.length);

      setState({
        isRecording: false,
        isProcessing: false,
        transcript,
        parsedResults: results,
        parsedResult: results[0] ?? null,
        error: null,
        confidence: result.confidence ?? 0,
      });
    } catch (e) {
      console.error("[VoiceInput] ❌ stopRecording beklenmedik exception:", e);
      setState((prev) => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        error: "transcription_error",
      }));
    }
  }, [recorder]);

  const cancelRecording = useCallback(async () => {
    try { await recorder.stop(); } catch {}
    setState(INITIAL_STATE);
  }, [recorder]);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const getErrorMessage = (error: string | null): string => {
    if (!error) return "";
    const messages: Record<string, string> = {
      mic_permission_denied: "Mikrofon izni gerekli. Ayarlardan izin verebilirsin.",
      recording_failed: "Kayıt başlatılamadı. Tekrar dene.",
      recording_too_short: "Ses kaydı çok kısa. En az 1-2 saniye konuşmayı dene.",
      simulator_no_mic: "Simülatörde gerçek mikrofon yok. Gerçek iPhone ile test et.",
      no_audio_file: "Ses dosyası oluşturulamadı.",
      empty_transcript: "Ses algılanamadı. Daha net konuşarak tekrar dene.",
      audio_too_large: "Ses kaydı çok uzun. Daha kısa bir kayıt dene.",
      stt_not_configured: "Ses tanıma servisi henüz yapılandırılmamış.",
      transcription_failed: "Ses tanıma başarısız. Tekrar dene.",
      fal_error: "Ses işleme servisi hata verdi. Biraz bekleyip tekrar dene.",
      transcription_timeout: "Ses tanıma zaman aşımına uğradı. Tekrar dene.",
      transcription_error: "Bir hata oluştu. Tekrar dene.",
      upload_failed: "Ses dosyası gönderilemedi. İnternet bağlantını kontrol et.",
      not_authenticated: "Oturum süresi dolmuş. Uygulamayı yeniden başlat.",
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
    isAvailable: true,
  };
};
