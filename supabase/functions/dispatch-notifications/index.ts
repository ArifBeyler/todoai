import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient } from "../_shared/supabase.ts";
import { corsHeaders, json, methodNotAllowed, serverError, unauthorized } from "../_shared/http.ts";

const WORKER_SECRET = Deno.env.get("WORKER_SECRET");

type NotificationEvent = {
  id: string;
  user_id: string;
  event_key: string;
  status: string;
  payload: Record<string, unknown>;
};

const TITLE_MAP: Record<string, string> = {
  avatar_ready: "Avatar Hazır!",
  daily_visual_ready: "Günlük Görselin Hazır!",
  daily_visual_generation_scheduled: "Görselin Hazırlanıyor",
  avatar_generation_started: "Avatar Oluşturuluyor",
  upload_clearer_photo_required: "Daha Net Bir Fotoğraf Gerekli",
  generation_failed_retry_available: "Oluşturma Başarısız - Tekrar Dene",
  generation_retry_scheduled: "Tekrar Deneniyor...",
  add_more_todos_to_unlock_daily_visual: "Görseli Açmak İçin Görev Ekle",
  task_reminder: "Görev Zamanı!",
  ai_suggestion_ready: "Bir Fikrim Var",
  focus_reminder: "Odaklan",
  focus_streak_risk: "Seri Devam",
  streak_milestone: "Tebrikler!",
  points_milestone: "Tebrikler!",
  evening_summary: "Günün Özeti",
  weekly_recap: "Haftalık Özet",
  re_engagement: "Seni Özledik",
};

const BODY_MAP: Record<string, string> = {
  avatar_ready: "Avatarın hazır! Ana ekranında seni bekliyor.",
  daily_visual_ready: "Bugünkü görselin hazır. Gel ve gör! ✨",
  daily_visual_generation_scheduled: "Görselin kuyruğa alındı, birazdan hazır.",
  avatar_generation_started: "Avatarın oluşturuluyor, biraz bekle.",
  upload_clearer_photo_required: "Yüz fotoğrafını daha net çekip tekrar yükle.",
  generation_failed_retry_available: "Görsel oluşturma başarısız oldu. Tekrar deneyebilirsin.",
  generation_retry_scheduled: "Görsel tekrar deneniyor, bir süre sonra hazır olacak.",
  add_more_todos_to_unlock_daily_visual: "Birkaç görev daha tamamla, günlük görselin açılsın!",
  task_reminder: "Görevin seni bekliyor!",
  ai_suggestion_ready: "Sana bir fikrim var — ne dersin?",
  focus_reminder: "25 dakika odaklanmaya ne dersin?",
  focus_streak_risk: "Odak serini devam ettirmek ister misin?",
  streak_milestone: "Harika bir seri yakaladın! 🔥",
  points_milestone: "Yeni bir puana ulaştın! 🎯",
  evening_summary: "Bugün harika iş çıkardın!",
  weekly_recap: "Haftanın özeti hazır.",
  re_engagement: "Görevlerin seni bekliyor 💫",
};

const sendPushNotification = async (token: string, title: string, body: string, data?: Record<string, unknown>) => {
  // MVP: Expo Push Notifications API
  try {
    const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: token,
        title,
        body,
        sound: "default",
        data: data ?? {},
      }),
    });
    const result = await pushResponse.json();
    return { success: true, result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return methodNotAllowed();
  if (WORKER_SECRET && request.headers.get("x-worker-secret") !== WORKER_SECRET) return unauthorized();

  try {
    const { data: events, error } = await adminClient
      .from("notification_events")
      .select("id, user_id, event_key, status, payload")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) return serverError("notification_fetch_failed", error.message);
    if (!events || events.length === 0) return json({ dispatched: 0, skipped: 0 });

    let dispatched = 0;
    let skipped = 0;
    let failed = 0;

    for (const event of events as NotificationEvent[]) {
      // Get user's active push token
      const { data: tokenRow } = await adminClient
        .from("notification_tokens")
        .select("token, platform")
        .eq("user_id", event.user_id)
        .eq("is_active", true)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!tokenRow) {
        // No push token, mark as skipped and use in-app fallback
        await adminClient
          .from("notification_events")
          .update({ status: "skipped", failure_reason: "no_push_token" })
          .eq("id", event.id);
        skipped += 1;
        continue;
      }

      // Check quiet hours
      const { data: prefs } = await adminClient
        .from("user_preferences")
        .select("quiet_hours_start, quiet_hours_end")
        .eq("user_id", event.user_id)
        .maybeSingle();

      if (prefs?.quiet_hours_start && prefs?.quiet_hours_end) {
        const { data: userData } = await adminClient
          .from("users")
          .select("timezone")
          .eq("id", event.user_id)
          .maybeSingle();

        const tz = userData?.timezone ?? "UTC";
        const nowLocal = new Date().toLocaleTimeString("en-US", { timeZone: tz, hour12: false });
        const start = prefs.quiet_hours_start;
        const end = prefs.quiet_hours_end;

        if (start > end) {
          // Overnight quiet hours (e.g. 22:00-07:00)
          if (nowLocal >= start || nowLocal < end) {
            await adminClient
              .from("notification_events")
              .update({ status: "deferred", failure_reason: "quiet_hours" })
              .eq("id", event.id);
            skipped += 1;
            continue;
          }
        } else if (nowLocal >= start && nowLocal < end) {
          await adminClient
            .from("notification_events")
            .update({ status: "deferred", failure_reason: "quiet_hours" })
            .eq("id", event.id);
          skipped += 1;
          continue;
        }
      }

      let title = TITLE_MAP[event.event_key] ?? "Doara";
      let body = BODY_MAP[event.event_key] ?? "Uygulamayı aç ve kontrol et.";

      const payload = event.payload ?? {};
      const name = (payload.name as string) ?? "";
      const todoTitle = (payload.todoTitle as string) ?? "";
      if (name && body.includes("{name}")) body = body.replace(/\{name\}/g, name);
      if (todoTitle) {
        if (payload.tone === "warm") {
          body = `${name}, ${todoTitle} seni bekliyor`;
        } else if (payload.tone === "calm") {
          body = `Sakin bir hatırlatma: ${todoTitle} listende`;
        } else {
          body = `${name ? name + ", " : ""}${todoTitle} için hazırsan başlayalım!`;
        }
        title = TITLE_MAP[event.event_key] ?? "Hatırlatma";
      }

      const sendResult = await sendPushNotification(tokenRow.token, title, body, {
        eventKey: event.event_key,
        ...event.payload,
      });

      if (sendResult.success) {
        await adminClient
          .from("notification_events")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", event.id);
        dispatched += 1;
      } else {
        await adminClient
          .from("notification_events")
          .update({ status: "failed", failure_reason: sendResult.error ?? "push_send_failed" })
          .eq("id", event.id);
        failed += 1;
      }
    }

    return json({ dispatched, skipped, failed });
  } catch (err) {
    return serverError("notification_dispatch_failed", String(err));
  }
});
