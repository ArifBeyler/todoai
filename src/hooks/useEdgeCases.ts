import { useCallback, useMemo } from "react";
import { useSessionStore } from "@state/useSessionStore";
import { useFTUEStore } from "@state/useFTUEStore";
import { useTodoStore } from "@state/useTodoStore";
import { TASK_MILESTONE_THRESHOLD } from "@state/useFTUEStore";

export type EdgeCaseType =
  | "none"
  | "paywall_dismissed"
  | "subscribed_no_photo"
  | "photo_skipped"
  | "photo_failed"
  | "generation_failed"
  | "insufficient_tasks"
  | "tasks_deleted_below_threshold"
  | "subscription_expired"
  | "processing_interrupted";

export const useEdgeCases = () => {
  const { isPremium, profilePhoto } = useSessionStore();

  const {
    paywallInteraction,
    photoUploadStatus,
    avatarStatus,
    generationEligibility,
    taskCountAtLastCheck,
  } = useFTUEStore();

  const activeTodoCount = useTodoStore(
    (s) => s.todos.filter((t) => !t.isCompleted).length,
  );

  const activeEdgeCases: EdgeCaseType[] = useMemo(() => {
    const cases: EdgeCaseType[] = [];

    if (paywallInteraction === "dismissed") {
      cases.push("paywall_dismissed");
    }

    if (isPremium && !profilePhoto && photoUploadStatus === "not_started") {
      cases.push("subscribed_no_photo");
    }

    if (photoUploadStatus === "skipped") {
      cases.push("photo_skipped");
    }

    if (photoUploadStatus === "failed") {
      cases.push("photo_failed");
    }

    if (generationEligibility === "failed") {
      cases.push("generation_failed");
    }

    if (
      activeTodoCount < TASK_MILESTONE_THRESHOLD &&
      taskCountAtLastCheck >= TASK_MILESTONE_THRESHOLD
    ) {
      cases.push("tasks_deleted_below_threshold");
    }

    if (activeTodoCount > 0 && activeTodoCount < TASK_MILESTONE_THRESHOLD) {
      cases.push("insufficient_tasks");
    }

    if (avatarStatus === "processing") {
      cases.push("processing_interrupted");
    }

    return cases.length > 0 ? cases : ["none"];
  }, [
    paywallInteraction,
    isPremium,
    profilePhoto,
    photoUploadStatus,
    generationEligibility,
    activeTodoCount,
    taskCountAtLastCheck,
    avatarStatus,
  ]);

  const primaryEdgeCase = activeEdgeCases[0] ?? "none";

  const getRecoveryAction = useCallback(
    (edgeCase: EdgeCaseType): string | null => {
      switch (edgeCase) {
        case "paywall_dismissed":
          return "soft_premium_teaser";
        case "subscribed_no_photo":
          return "show_photo_sheet";
        case "photo_skipped":
          return "show_photo_reminder";
        case "photo_failed":
          return "show_reupload_prompt";
        case "generation_failed":
          return "show_retry_sheet";
        case "insufficient_tasks":
          return "show_task_progress";
        case "tasks_deleted_below_threshold":
          return "show_task_progress";
        case "subscription_expired":
          return "expire_premium";
        case "processing_interrupted":
          return "resume_processing_state";
        default:
          return null;
      }
    },
    [],
  );

  const getEdgeCaseMessage = useCallback(
    (
      edgeCase: EdgeCaseType,
    ): { title: string; subtitle: string } | null => {
      switch (edgeCase) {
        case "paywall_dismissed":
          return {
            title: "Premium'u keşfet",
            subtitle: "Kişisel AI görselleri seni bekliyor.",
          };
        case "subscribed_no_photo":
          return {
            title: "Fotoğrafını yükle",
            subtitle: "Kişisel görsellerini açmak için bir selfie ekle.",
          };
        case "photo_skipped":
          return {
            title: "Kişiselleştirmeyi tamamla",
            subtitle: "Fotoğrafını yükle, sana özel görseller üretelim.",
          };
        case "photo_failed":
          return {
            title: "Fotoğraf yüklenemedi",
            subtitle: "Lütfen daha net bir fotoğraf ile tekrar dene.",
          };
        case "generation_failed":
          return {
            title: "Görsel oluşturulamadı",
            subtitle: "Tekrar denemen yeterli, hemen düzeltiyoruz.",
          };
        case "insufficient_tasks":
          return null;
        case "tasks_deleted_below_threshold":
          return {
            title: "Görsel eşiğinin altına düştün",
            subtitle: "Yeni bir görsel için en az 3 aktif görev gerekli.",
          };
        case "subscription_expired":
          return {
            title: "Aboneliğin sona erdi",
            subtitle: "Premium'a abone olarak kişisel görsellere devam et.",
          };
        case "processing_interrupted":
          return {
            title: "İşlem devam ediyor",
            subtitle: "Görselin hâlâ hazırlanıyor, birazdan hazır olacak.",
          };
        default:
          return null;
      }
    },
    [],
  );

  return {
    activeEdgeCases,
    primaryEdgeCase,
    getRecoveryAction,
    getEdgeCaseMessage,
  };
};
