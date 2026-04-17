# Doara – Test Bulguları & İyileştirme Planı

> Tarih: 17 Nisan 2026  
> Test Aracı: Maestro CLI 2.4.0  
> Cihaz: iPhone 17 Pro Simulator (iOS 26.2)  
> Test Sonucu: **10/10 Passed** (tüm testler geçiyor)

---

## 🔴 Kritik Hatalar

### BUG-01 — RevenueCat Offerings API 404 Hatası

- **Ekran:** Uygulama geneli (paywall, premium bridge)
- **Semptom:** Uygulama açıldığında RevenueCat, offerings endpoint'inden sürekli 404 alıyor. Bu paywall ekranında teklifler yüklenemiyor.
- **Log:**
  ```
  ERROR [RevenueCat] 😿‼️ Unknown error. API request failed with status code 404
  ERROR [RevenueCat] 🍎‼️ Error fetching offerings – İşlem tamamlanamadı.
  ```
- **Kök Neden:** `EXPO_PUBLIC_REVENUECAT_IOS_KEY=test_wLVEblpZrHVxAzudHfiLaZchulA` test API anahtarı kullanılıyor. RevenueCat dashboard'unda bu proje için **iOS Offering** tanımlanmamış ya da test ortamında aktif değil.
- **Düzeltme:** RevenueCat dashboard → Products → Offerings → en az 1 aktif offering oluştur. Simulator'da StoreKit Configuration dosyası (`.storekit`) tanımlanmalı.
- **Etkilenen Dosyalar:** `src/services/revenuecat.ts`, `src/providers/RevenueCatProvider.tsx`, `app/paywall.tsx`, `app/premium-bridge.tsx`

---

## 🟡 Orta Öncelikli Sorunlar

### BUG-02 — Takvim: "Bugüne git" Butonu Development Build'de Güvenilir Değil

- **Ekran:** `app/(tabs)/calendar.tsx`
- **Semptom:** "Sonraki hafta" tıklandığında Expo Dev Tools paneli zaman zaman açılıyor. Bu, butonun state'ini sıfırlar ve `isToday` yeniden `true` döner → "Bugüne git" butonu gizlenir.
- **Kök Neden:** Development build'de 3 parmak dokunuşu Dev Menu açıyor. Maestro'nun simüle ettiği tap aksiyonları bu menüyü tetikleyebiliyor.
- **Düzeltme:**
  1. Production/Release build üzerinde test et (`npx expo run:ios --configuration Release`)
  2. Veya `DevSettings.setIsDebuggingRemotely(false)` ile debug menüsünü kapat
- **Etkilenen Dosyalar:** `app/(tabs)/calendar.tsx` (satır 163–172)

### BUG-03 — "Tamamlama Oranı" Stats Kartı Görünürlük Sorunu

- **Ekran:** `app/(tabs)/home.tsx`
- **Semptom:** Segment geçişlerinden sonra "Tamamlama oranı ekranını aç" butonu bazen accessibility tree'de görünmüyor (test 03'te uyarı verdi, doğrudan açıldığında mevcut).
- **Kök Neden:** `completionRate` hesaplaması `visibleTodos.length` 0 olduğunda edge case → muhtemelen segment değişiminde re-render sırasında kısa bir an için view gizleniyor ya da animasyon devam ediyor.
- **Düzeltme:** Stats kart containerına `minHeight` ekle, visibility'i `opacity` ile yönet (unmount/mount yerine), `waitForAnimationToEnd` süresini artır.
- **Etkilenen Dosyalar:** `app/(tabs)/home.tsx` (satır 572–600), ilgili styles

### BUG-04 — RevenueCat "Test Store API Key" Uyarısı

- **Ekran:** Uygulama geneli (konsol log'ları)
- **Semptom:**
  ```
  WARN [RevenueCat] ⚠️ Using a Test Store API key.
  ```
- **Kök Neden:** `.env`'deki `EXPO_PUBLIC_REVENUECAT_IOS_KEY` test key ile başlıyor (`test_wLVE...`). Production'da bu live key olmalı.
- **Düzeltme:** `.env.production` dosyası oluştur, EAS build'de environment'a göre doğru key inject et.
- **Etkilenen Dosyalar:** `.env`, `eas.json`

### BUG-05 — Profil: "Apple Abonelik Yönetimi" Sadece Premium Kullanıcılarda Görünüyor

- **Ekran:** `app/(tabs)/profile.tsx`
- **Semptom:** `isPremium && (trialActive || expirationDate)` koşulu sağlanmadığı için ücretsiz kullanıcılarda bu element görünmüyor.
- **Durum:** Bu **expected behavior** — ancak ücretsiz kullanıcıların subscription durumunu yönetmek için alternatif bir erişim noktası sunulmalı (örn. restore purchases butonu her zaman görünür olmalı).
- **Düzeltme:** Profil ekranına her kullanıcı için "Satın alımları geri yükle" (Restore Purchases) butonu ekle.
- **Etkilenen Dosyalar:** `app/(tabs)/profile.tsx`

---

## 🟢 Düşük Öncelikli İyileştirmeler

### IMP-01 — testID Eksikliği: Çok Sayıda Element testID Kullanmıyor

- **Semptom:** Maestro testleri pek çok element için `text` veya `accessibilityLabel` ile bulma yapmak zorunda kalıyor. Metin değişirse test kırılır.
- **Düzeltme:** Kritik interaktif elementlere `testID` ekle:
  - Home: Stats kartları, segment butonları
  - Calendar: Gün hücreleri, hafta navigasyonu
  - New Todo: Başlık TextInput, kaydet butonu
  - Focus: Başlat/duraklat butonu, timer
  - AI Assistant: Input alanı, gönder butonu
- **Etkilenen Dosyalar:** `app/(tabs)/home.tsx`, `app/(tabs)/calendar.tsx`, `app/todo/new.tsx`, `app/(tabs)/focus.tsx`, `app/ai-assistant.tsx`

### IMP-02 — Maestro Testleri Sadece Development Build'de Çalışıyor

- **Semptom:** `maestro test` çalıştırmak için her seferinde Metro Bundler başlatılmalı ve development client üzerinden URL açılmalı.
- **Düzeltme:** Release build (.app dosyası) üzerinden test et. Bunun için:
  ```bash
  npx expo run:ios --configuration Release
  maestro test .maestro/
  ```
  Böylece Dev Tools müdahalesi ve Metro bağımlılığı ortadan kalkar.

### IMP-03 — AI Asistanı: Response Bekleme Süresi Test Edilemiyor

- **Ekran:** `app/ai-assistant.tsx`
- **Semptom:** AI asistanına mesaj gönderildiğinde LLM yanıtını beklemek için Maestro'da sabit `waitForAnimationToEnd` yeterli olmayabiliyor. Görev önerileri geliyor mu testi yok.
- **Düzeltme:** `assertVisible: { text: "Tümünü ekle", optional: true }` ile response geldi mi assertion'ı ekle, timeout süresini artır.

### IMP-04 — Focus Ekranı: Timer Başlatma/Durdurma Testi Eksik

- **Ekran:** `app/(tabs)/focus.tsx`
- **Semptom:** Mevcut test sadece "Odak oturumunu başlat" butonunun visible olduğunu kontrol ediyor. Start → Pause → Stop tam döngüsü test edilmiyor.
- **Düzeltme:** Timer döngüsü test flow'u yaz.

### IMP-05 — Onboarding Akışı Hiç Test Edilmemiyor

- **Ekran:** `app/(onboarding)/`
- **Semptom:** 20+ onboarding ekranı (welcome, name, goal, photo, vb.) için hiç Maestro testi yok.
- **Düzeltme:** Kritik onboarding adımları için akış testi yaz. Özellikle auth → name → goal → subscription flow.

### IMP-06 — Yeni Görev: Alışkanlık Modu Test Edilmiyor

- **Ekran:** `app/todo/new.tsx`
- **Semptom:** Test 04 sadece "Görev" modunda `inputText` yapıyor. "Alışkanlık" moduna geçiş, tekrar ayarları, ikon/renk seçimi test edilmiyor.

---

## ✅ Çalışan Özellikler (Test Geçti)


| Test                     | Ekran                               | Süre |
| ------------------------ | ----------------------------------- | ---- |
| 01_app_launch            | Uygulama açılışı                    | 3s   |
| 02_tab_navigation        | Tab bar navigasyonu                 | 23s  |
| 03_home_segments         | Ana sayfa segment geçişleri + stats | 24s  |
| 04_add_manual_todo       | Manuel görev ekleme                 | 23s  |
| 05_ai_assistant          | AI asistan açılış + mesaj           | 24s  |
| 06_calendar_tab          | Takvim, hafta navigasyonu           | 36s  |
| 07_focus_tab             | Focus ekranı açılışı                | 19s  |
| 08_profile_tab           | Profil ekranı + scroll              | 16s  |
| 02_add_todo (eski)       | Genel todo akışı                    | 14s  |
| 03_tab_navigation (eski) | Tab ID bazlı navigasyon             | 19s  |


**Toplam: 10/10 — 3 dakika 21 saniye**

---

## 🚀 Öncelik Sırası (Önerilen)

1. **[BUG-01]** RevenueCat Offerings 404 → Paywall çalışmıyor, premium akışı broken
2. **[BUG-04]** Production API Key setup → EAS build environment
3. **[BUG-05]** Restore Purchases butonu → Her kullanıcıya erişilebilir olmalı
4. **[IMP-01]** testID eklenmesi → Test güvenilirliğini artırır
5. **[IMP-05]** Onboarding testleri → Yeni kullanıcı akışı kritik
6. **[BUG-02]** Production build test → Dev mode sorunlarını elimine eder
7. **[BUG-03]** Stats kart görünürlük → Minor UX edge case
8. **[IMP-04]** Focus timer döngüsü testi
9. **[IMP-03]** AI response assertion
10. **[IMP-06]** Alışkanlık modu testi

