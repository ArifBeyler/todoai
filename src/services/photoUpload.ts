import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "./supabase";
import { useSessionStore } from "@state/useSessionStore";
import { useFTUEStore } from "@state/useFTUEStore";

type UploadResult = {
  success: boolean;
  photoId?: string;
  jobId?: string;
  error?: string;
};

type SignedUrlResponse = {
  uploadUrl: string;
  token: string;
  photoId: string;
  storagePath: string;
  consentId: string;
};

type FinalizeResponse = {
  status: string;
  photoId: string;
  jobId?: string;
};

export const uploadPhotoToBackend = async (
  localUri: string,
): Promise<UploadResult> => {
  const { setPhotoUploadStatus } = useFTUEStore.getState();
  setPhotoUploadStatus("uploading");

  try {
    const { data: urlData, error: urlError } =
      await supabase.functions.invoke<SignedUrlResponse>(
        "create-photo-upload-url",
        { body: {} },
      );

    if (urlError || !urlData?.uploadUrl) {
      let detail = urlError?.message ?? "signed_url_failed";
      try {
        const ctx = (urlError as any)?.context;
        if (ctx instanceof Response) {
          const body = await ctx.json();
          detail = body?.detail ?? body?.error ?? detail;
        }
      } catch { /* ignore parse errors */ }
      setPhotoUploadStatus("failed");
      return { success: false, error: String(detail) };
    }

    const uploadResult = await FileSystem.uploadAsync(
      urlData.uploadUrl,
      localUri,
      {
        httpMethod: "PUT",
        headers: {
          "Content-Type": "image/jpeg",
          Authorization: `Bearer ${urlData.token}`,
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      },
    );

    if (uploadResult.status < 200 || uploadResult.status >= 300) {
      setPhotoUploadStatus("failed");
      return {
        success: false,
        error: `upload_failed_${uploadResult.status}`,
      };
    }

    const { data: finalizeData, error: finalizeError } =
      await supabase.functions.invoke<FinalizeResponse>(
        "finalize-photo-upload",
        {
          body: {
            photoId: urlData.photoId,
            storagePath: urlData.storagePath,
            consentId: urlData.consentId,
            mimeType: "image/jpeg",
          },
        },
      );

    if (finalizeError || !finalizeData) {
      setPhotoUploadStatus("failed");
      return {
        success: false,
        error: finalizeError?.message ?? "finalize_failed",
      };
    }

    setPhotoUploadStatus("uploaded");
    useFTUEStore.getState().setAvatarStatus("processing");

    useSessionStore.getState().setProfilePhoto(localUri);

    return {
      success: true,
      photoId: finalizeData.photoId,
      jobId: finalizeData.jobId,
    };
  } catch (error) {
    setPhotoUploadStatus("failed");
    return { success: false, error: String(error) };
  }
};

export const pollAvatarStatus = async (): Promise<{
  status: "processing" | "succeeded" | "failed";
  avatarUrl?: string;
}> => {
  const { data, error } = await supabase.functions.invoke("get-home-state", {
    body: {},
  });

  if (error || !data) {
    return { status: "processing" };
  }

  const heroState = data.heroState as string | undefined;

  if (data.avatarSummary?.id) {
    return {
      status: "succeeded",
      avatarUrl: data.avatarSummary.signedUrl ?? data.avatarSummary.imageUrl,
    };
  }

  if (heroState === "photo_processing") {
    return { status: "processing" };
  }

  if (
    heroState === "subscribed_no_photo" ||
    heroState === "unsubscribed"
  ) {
    return { status: "failed" };
  }

  return { status: "processing" };
};
