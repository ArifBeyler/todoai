import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, json, methodNotAllowed, serverError } from "../_shared/http.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";

type GalleryItem = {
  id: string;
  type: "avatar" | "visual" | "daily";
  imageUrl: string;
  thumbnailUrl?: string;
  todoTitles: string[];
  createdAt: string;
  month: string;
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "GET" && request.method !== "POST") return methodNotAllowed();

  const { user, response: authError } = await getUserFromRequest(request);
  if (authError) return authError;
  if (!user) return json({ error: "unauthorized" }, 401);

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
    const offset = (page - 1) * limit;

    const items: GalleryItem[] = [];

    const { data: avatars } = await adminClient
      .from("avatars")
      .select("id, image_url, storage_path, created_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    for (const avatar of avatars ?? []) {
      let imageUrl = avatar.image_url;
      if (!imageUrl && avatar.storage_path) {
        const { data: signed } = await adminClient.storage
          .from("avatars-private")
          .createSignedUrl(avatar.storage_path, 3600);
        imageUrl = signed?.signedUrl ?? null;
      }
      if (imageUrl) {
        const date = new Date(avatar.created_at);
        items.push({
          id: avatar.id,
          type: "avatar",
          imageUrl,
          todoTitles: [],
          createdAt: avatar.created_at,
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        });
      }
    }

    const { data: visuals } = await adminClient
      .from("generated_visuals")
      .select("id, image_url, thumbnail_url, prompt_used, created_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .range(0, limit + 10);

    for (const visual of visuals ?? []) {
      if (!visual.image_url) continue;

      const { data: todoLinks } = await adminClient
        .from("visual_todos")
        .select("todo_id")
        .eq("visual_id", visual.id);

      let todoTitles: string[] = [];
      if (todoLinks && todoLinks.length > 0) {
        const todoIds = todoLinks.map((l: { todo_id: string }) => l.todo_id);
        const { data: todos } = await adminClient
          .from("todos")
          .select("title")
          .in("id", todoIds);
        todoTitles = (todos ?? []).map((t: { title: string }) => t.title);
      }

      const date = new Date(visual.created_at);
      items.push({
        id: visual.id,
        type: "visual",
        imageUrl: visual.image_url,
        thumbnailUrl: visual.thumbnail_url ?? undefined,
        todoTitles,
        createdAt: visual.created_at,
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      });
    }

    const { data: dailyVisuals } = await adminClient
      .from("daily_visuals")
      .select("id, image_url, thumbnail_url, storage_path, visual_date, created_at")
      .eq("user_id", user.id)
      .order("visual_date", { ascending: false })
      .range(0, limit + 10);

    for (const dv of dailyVisuals ?? []) {
      let imageUrl = dv.image_url;
      if (!imageUrl && dv.storage_path) {
        const { data: signed } = await adminClient.storage
          .from("daily-visuals-private")
          .createSignedUrl(dv.storage_path, 3600);
        imageUrl = signed?.signedUrl ?? null;
      }
      if (!imageUrl) continue;

      const existingIds = new Set(items.map((i) => i.id));
      if (existingIds.has(dv.id)) continue;

      const date = new Date(dv.created_at);
      items.push({
        id: dv.id,
        type: "daily",
        imageUrl,
        thumbnailUrl: dv.thumbnail_url ?? undefined,
        todoTitles: [],
        createdAt: dv.created_at,
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      });
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const grouped: Record<string, GalleryItem[]> = {};
    for (const item of items) {
      if (!grouped[item.month]) grouped[item.month] = [];
      grouped[item.month].push(item);
    }

    const paginatedItems = items.slice(offset, offset + limit);

    return json({
      items: paginatedItems,
      grouped,
      total: items.length,
      page,
      limit,
      hasMore: offset + limit < items.length,
    });
  } catch (err) {
    return serverError("get_gallery_failed", String(err));
  }
});
