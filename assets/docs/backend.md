# Supabase Odakli Backend Plani

## STEP 1 - Requirement Audit

### Eksik urun gereksinimleri
- "Gunluk gorsel" ne zaman uretilir net degil: gun basinda mi, kullanici aktif oldugunda mi, cron penceresinde mi.
- "Yeterli anlamli todo" tanimi eksik: sadece adet mi, kategori cesitliligi mi, semantik guven skoru mu.
- Avatar onayi sonrasi kullanici "bu ben degilim" derse fallback akisi tanimsiz.
- Premium/Paywall etkisi net degil: gunluk kac gorsel hakki, regenerate hakki, frekans limitleri.

### Eksik backend gereksinimleri
- Idempotency kurallari yoksa cift job ve cift maliyet riski yuksek.
- Queue lease/timeout yoksa worker crash durumunda joblar kitlenir.
- Webhook dogrulama semasi ve replay-protection belirtilmemis.
- Cost attribution (job bazli dolar maliyet) olmadan unit economics izlenemez.

### Eksik UX/system state'leri
- Photo quality: `pending_review`, `reupload_required`, `accepted` state seti gerekli.
- Generation state: `pending`, `leased`, `processing`, `succeeded`, `failed`, `cancelled`.
- Kullaniciya geri bildirim state'i: `retry_scheduled`, `retry_available`, `manual_review_required`.

### Moderation / privacy bosluklari
- Kalici foto saklama karari verildi; bu karar icin risk ve compliance notu zorunlu.
- Yas dogrulama yoksa minor kullanici default'u "safe mode + scene kisiti" olmali.
- Prompt abuse (zararli, aldatıcı, cinsel, siyasi manipule) filtre katmani gerekli.

### Bildirim bosluklari
- Event adlari, dedupe anahtari ve sessiz saat/timezone kurallari tanimsiz.
- Basarisiz generation bildiriminde "tek tusla retry" mekanigi net degil.

### Veri iliskileri bosluklari
- `generated_visuals` ile `generation_jobs` bagi eksikti.
- Todo -> semantic intent normalize tablosu eksikti.
- Consent versiyonlama ve revoke tarihi tutulmuyordu.

### Gercekcilik ve maliyet riskleri
- Senkron generation varsayimi gercekci degil; webhook + async zorunlu.
- "Her todo eklendiginde gorsel" maliyeti patlatir; gunluk cap ve idempotency gerekli.
- Ayni gun ayni kullanıcı icin duplicate scene generation engellenmeli.

### MVP vs Sonrasi ayrimi
- MVP: avatar + gunluk tek scene + temel retry.
- V1: admin paneli, cost dashboard, moderation queue.
- V2: daha iyi task semantics, kalite skorlama, akilli batching.

---

## STEP 2 - Karar Odakli Sorular (Max 15)

### Product behavior
1. Gunluk scene icin hard limit kac olsun: `1/gun` mi `2/gun` mu?
2. "Anlamli todo" kriteri sadece adet mi yoksa `scene_safe` kategorisi zorunlu mu?
3. Avatar onay ekraninda "reject + yeniden olustur" icin max deneme sayisi kac olmali?

### AI generation rules
4. Scene generation fallback'i ne olsun: provider fail olursa onceki gorseli mi yoksa "bugun olusmadi" karti mi?
5. Prompt version rollout nasil yapilsin: tum kullanicilar birden mi, yuzde rollout mu?
6. Regenerate hakki premium kullanicida gunluk kac adet?

### User identity / privacy
7. Orijinal yuz fotosu kalici saklanacak; encrypt-at-rest disinda uygulama ici erisim logu da tutulacak mi?
8. Kullanici "consent revoke" yapinca yeni generation'lar aninda dursun mu?
9. Unknown age kullanicilar icin default policy: sadece "safe activity" seti mi?

### Task interpretation
10. "Study English" gibi soyut gorevlerde "metaforik sahne"ye izin var mi, yoksa scene disi mi sayilsin?
11. Cakisan gorevlerde (kosu + uyku) secim stratejisi: oncelik + confidence mi, yoksa kullanicidan secim mi?

### Scheduling / notifications
12. Scheduler hangi lokal saatte calissin: 10:00 lokal mi, kullanici tercihine gore slot mu?
13. Push bildirim sessiz saatleri varsayilan kac olsun?

### Admin / operations
14. Manual regenerate sadece admin mi, premium kullanici da tetikleyebilsin mi?
15. SLA hedefi nedir: P95 scene hazir olma suresi kac dakika?

---

## STEP 3 - Varsayimli Cozum (Cevaplar Tam Olmadan)

## 1) Product assumptions
- Backend: Supabase merkezli (Auth + Postgres + Storage + Edge Functions + Cron).
- Asenkron pipeline: tum generation isleri job tabanli.
- Orijinal yuz fotosu kalici saklanir, consent revoke ile yeni generation engellenir.
- Premium kullanicida gunluk 1 scene varsayildi.

## 2) Recommended backend architecture
- Mobil istemci -> Supabase Edge Functions (`generate-visual`, `poll-generation`).
- Queue: `generation_jobs` tablosu.
- Scheduler: `schedule-generation` (cron).
- Worker: `process-generation-jobs` job claim + process.
- Provider callback: `fal-webhook`.
- Notification fanout: `notification_events` + `dispatch-notifications`.

## 3) Recommended services and responsibilities
- `generate-visual`: auth, input validation, idempotent enqueue.
- `schedule-generation`: uygun kullanicilari sec, daily scene enqueue.
- `process-generation-jobs`: lease et, dene, visual yaz, maliyet kaydi olustur.
- `fal-webhook`: provider event ingest + job state finalize.
- `dispatch-notifications`: queued event'leri sent durumuna ceker (MVP mock).

## 4) Database schema proposal
- Yeni tablo ve enumlar:
  - `generation_jobs`, `generation_job_attempts`
  - `task_intents`
  - `user_consents`
  - `webhook_events`
  - `notification_events`
  - `moderation_flags`
  - `cost_ledger`
  - enum: `generation_job_type`, `generation_job_status`, `scene_safety`
- Yardimci SQL:
  - `claim_generation_jobs(worker_name, max_jobs)` RPC (SKIP LOCKED lease modeli)
  - `touch_updated_at()` trigger

## 5) Storage structure proposal
- Bucket ayrimi:
  - `user-face-originals/{user_id}/{photo_id}.jpg` (kalici, private)
  - `avatars/{user_id}/{visual_id}.jpg` (private)
  - `daily-scenes/{user_id}/{yyyy-mm-dd}/{visual_id}.jpg` (private)
  - `thumbs/{user_id}/{visual_id}.jpg` (private)
- Public URL yerine signed URL tercih edilir.

## 6) API / endpoint proposal
- `POST /functions/v1/generate-visual`
  - body: `jobType`, `todoIds`, `promptVersion`, `metadata`
  - response: `queued|already_queued`, `job.id`
- `GET|POST /functions/v1/poll-generation`
  - input: `jobId`
  - response: job state + visual data + `recommendedPollAfterMs`
- `POST /functions/v1/schedule-generation` (cron secret)
- `POST /functions/v1/process-generation-jobs` (worker secret)
- `POST /functions/v1/fal-webhook` (signature dogrulama)
- `POST /functions/v1/dispatch-notifications` (worker secret)

## 7) Async job pipeline proposal
1. Uygulama `generate-visual` cagirir.
2. Job `pending` olarak kuyruga yazilir.
3. Worker `claim_generation_jobs` ile lease eder (`leased` -> `processing`).
4. Uretim basariliysa `generated_visuals` yazilir, job `succeeded`.
5. Hata varsa attempt artar, backoff ile `pending` veya `failed`.

## 8) Webhook handling design
- Her webhook payload once `webhook_events` tablosuna yazilir.
- Signature kontrolu sonucu `signature_valid` alanina kaydedilir.
- `external_event_id` ile event dedupe/replay analizi yapilir.
- Isleme basarisiz olursa `process_status=failed` ve `process_error` tutulur.

## 9) Notification event map
- `upload_clearer_photo_required`
- `avatar_generation_started`
- `avatar_ready`
- `add_more_todos_to_unlock_daily_visual`
- `daily_visual_generation_scheduled`
- `daily_scene_generation_started`
- `daily_visual_ready`
- `generation_retry_scheduled`
- `generation_failed_retry_available`

## 10) Failure and retry map
- Provider timeout: 1, 2, 3 dakika backoff.
- DB transient hata: aynı attempt icinde tek retry.
- Max attempt asimi: `failed`, kullaniciya retry available event.
- Worker crash: lease timeout sonrasi yeniden claim.

## 11) Cost control strategy
- Gunluk idempotency key: `daily_scene:{user_id}:{date}`.
- Premium disi veya yetersiz todo icin enqueue engeli.
- Prompt ve style versiyonlama ile A/B maliyet karsilastirmasi.
- `cost_ledger` ile job bazli USD kaydi.

## 12) Privacy / consent strategy
- Consent version tablosu (`user_consents`) ile audit izi.
- Revoke durumunda yeni generation engeli.
- Kalici foto saklama nedeniyle:
  - private bucket
  - access log
  - servis rolü disinda dogrudan erisim yok
- Unknown age: varsayilan safe-only scene policy.

## 13) MVP scope
- Auth + onboarding temel stateleri.
- Avatar generation (async queue tabanli).
- Gunluk scene generation scheduler + worker + poll.
- Basit bildirim kuyrugu ve failure/retry mekanigi.

## 14) V2 scope
- Gelismis task interpreter (intent conflict resolution, confidence learning).
- Gercek push provider teslimat ve kanal fallback (push + in-app).
- Admin operasyon paneli: job inspect, manual regenerate, moderation queue.
- Dynamic prompt policy ve rollout stratejisi.

## 15) Open decisions we still need from the product team
- Gunluk hard generation limiti.
- Regenerate entitlement modeli.
- Sessiz saat ve timezone stratejisi.
- Unknown age policy katiligi.
- SLA hedefleri ve error budget.
- Prompt rollout stratejisi.
- Consent revoke sonrasi eski gorsellerin kaderi.