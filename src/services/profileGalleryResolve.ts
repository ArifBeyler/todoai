import { supabase } from "@/src/services/supabase";

export type ParsedProfileGalleryId =
  | { kind: "avatar"; uuid: string }
  | { kind: "visual"; uuid: string };

export const parseProfileGalleryCompositeId = (
  compositeId: string,
): ParsedProfileGalleryId | null => {
  if (compositeId.startsWith("avatar-")) {
    return { kind: "avatar", uuid: compositeId.slice("avatar-".length) };
  }
  if (compositeId.startsWith("visual-")) {
    return { kind: "visual", uuid: compositeId.slice("visual-".length) };
  }
  return null;
};

const toSignedUrlIfNeeded = async (
  pathOrUrl: string | null | undefined,
  bucket: "avatars-private" | "daily-visuals-private",
): Promise<string | null> => {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(pathOrUrl, 3600);
  if (error) return null;
  return data?.signedUrl ?? null;
};

export type ResolvedGalleryDetail = {
  compositeId: string;
  kind: "avatar" | "visual";
  imageUrl: string;
  createdAt: string | null;
};

export const resolveProfileGalleryItem = async (
  compositeId: string,
): Promise<ResolvedGalleryDetail | null> => {
  const parsed = parseProfileGalleryCompositeId(compositeId);
  if (!parsed) return null;

  if (parsed.kind === "avatar") {
    const { data, error } = await supabase
      .from("avatars")
      .select("id, image_url, storage_path, created_at")
      .eq("id", parsed.uuid)
      .maybeSingle();
    if (error || !data) return null;
    const resolved =
      (await toSignedUrlIfNeeded(data.storage_path, "avatars-private")) ??
      (await toSignedUrlIfNeeded(data.image_url, "avatars-private"));
    if (!resolved) return null;
    return {
      compositeId,
      kind: "avatar",
      imageUrl: resolved,
      createdAt: data.created_at ?? null,
    };
  }

  const { data, error } = await supabase
    .from("generated_visuals")
    .select("id, image_url, thumbnail_url, status, created_at")
    .eq("id", parsed.uuid)
    .eq("status", "success")
    .maybeSingle();
  if (error || !data) return null;
  const raw = data.thumbnail_url ?? data.image_url;
  if (!raw) return null;
  const resolved =
    (await toSignedUrlIfNeeded(raw, "daily-visuals-private")) ??
    (await toSignedUrlIfNeeded(raw, "avatars-private"));
  if (!resolved) return null;
  return {
    compositeId,
    kind: "visual",
    imageUrl: resolved,
    createdAt: data.created_at ?? null,
  };
};

export const setActiveAvatarForCurrentUser = async (avatarUuid: string): Promise<boolean> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return false;
  const { error } = await supabase
    .from("users")
    .update({ active_avatar_id: avatarUuid })
    .eq("id", session.user.id);
  return !error;
};
