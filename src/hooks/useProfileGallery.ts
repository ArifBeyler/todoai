import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/services/supabase";

export type ProfileGalleryItem = {
  id: string;
  type: "avatar" | "visual";
  imageUrl: string;
  createdAt: string;
};

type AvatarRow = {
  id: string;
  image_url: string | null;
  storage_path: string | null;
  created_at: string;
};

type VisualRow = {
  id: string;
  image_url: string | null;
  thumbnail_url: string | null;
  status: string | null;
  created_at: string;
};

const toSignedUrlIfNeeded = async (
  pathOrUrl: string | null | undefined,
  bucket: "avatars-private" | "daily-visuals-private",
): Promise<string | null> => {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http")) return pathOrUrl;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(pathOrUrl, 3600);

  if (error) return null;
  return data?.signedUrl ?? null;
};

export const useProfileGallery = () => {
  const [items, setItems] = useState<ProfileGalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGallery = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [{ data: avatars, error: avatarsError }, { data: visuals, error: visualsError }] =
        await Promise.all([
          supabase
            .from("avatars")
            .select("id, image_url, storage_path, created_at")
            .order("created_at", { ascending: false })
            .limit(100),
          supabase
            .from("generated_visuals")
            .select("id, image_url, thumbnail_url, status, created_at")
            .eq("status", "success")
            .order("created_at", { ascending: false })
            .limit(300),
        ]);

      if (avatarsError) throw avatarsError;
      if (visualsError) throw visualsError;

      const avatarRows = (avatars ?? []) as AvatarRow[];
      const visualRows = (visuals ?? []) as VisualRow[];

      const avatarItems = (
        await Promise.all(
          avatarRows.map(async (row): Promise<ProfileGalleryItem | null> => {
            const resolvedUrl =
              (await toSignedUrlIfNeeded(row.storage_path, "avatars-private")) ??
              (await toSignedUrlIfNeeded(row.image_url, "avatars-private"));

            if (!resolvedUrl) return null;
            return {
              id: `avatar-${row.id}`,
              type: "avatar",
              imageUrl: resolvedUrl,
              createdAt: row.created_at,
            };
          }),
        )
      ).filter((item): item is ProfileGalleryItem => item !== null);

      const visualItems = (
        await Promise.all(
          visualRows.map(async (row): Promise<ProfileGalleryItem | null> => {
            const raw = row.thumbnail_url ?? row.image_url;
            if (!raw) return null;

            const resolvedUrl =
              (await toSignedUrlIfNeeded(raw, "daily-visuals-private")) ??
              (await toSignedUrlIfNeeded(raw, "avatars-private"));

            if (!resolvedUrl) return null;
            return {
              id: `visual-${row.id}`,
              type: "visual",
              imageUrl: resolvedUrl,
              createdAt: row.created_at,
            };
          }),
        )
      ).filter((item): item is ProfileGalleryItem => item !== null);

      const merged = [...avatarItems, ...visualItems].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setItems(merged);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Galeri yüklenemedi";
      setError(message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  return useMemo(
    () => ({ items, isLoading, error, refresh: fetchGallery }),
    [items, isLoading, error, fetchGallery],
  );
};
