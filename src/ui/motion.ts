import { FadeIn, FadeInLeft, FadeInUp } from "react-native-reanimated";

/**
 * Onboarding animasyon sırası (tüm slaytlarda hedef):
 * Üstten alta tek zincir — önceki blok (rozet, başlık, alt metin, kart) bitmeden
 * alttaki `entering` / kelime `startDelay` başlamasın. Kart içinde de satır satır
 * yukarıdan aşağıya. Footer / CTA, içerik zaman çizelgesinin sonuna bağlansın.
 *
 * Metin animasyonu: karşılama (welcome) ile aynı — `SequentialTyping`, soldan sağa
 * karakter + imleç; `onboardingTyping.charDelayMs` kullan.
 */

export const onboardingTyping = {
  charDelayMs: 22,
  showCursor: true,
} as const;

/** Onboarding metinleri: kelime kelime yumuşak FadeInUp (spring) */
export const onboardingWordEnter = (delayMs: number) =>
  FadeInUp.delay(delayMs)
    .duration(286)
    .springify()
    .damping(16)
    .stiffness(128);

/** Kart içi küçük başlık / etiket (ör. pain label): soldan hafif kayma + fade */
export const onboardingCardHeadlineEnter = (delayMs: number) =>
  FadeInLeft.delay(delayMs)
    .duration(300)
    .springify()
    .damping(17)
    .stiffness(132);

/** Üstten alta sıralı kart kutusu: hafif aşağıdan doğru oturma */
export const onboardingCardShellEnter = (delayMs: number) =>
  FadeInUp.delay(delayMs)
    .duration(286)
    .springify()
    .damping(15)
    .stiffness(118);

export const preHomeMotion = {
  screenEnter: FadeIn.duration(229),
  sectionEnter: (delay = 0) => FadeInUp.delay(delay).duration(257),
  cardEnter: (delay = 0) => FadeInUp.delay(delay).duration(271),
  ctaEnter: (delay = 0) => FadeInUp.delay(delay).duration(243),
} as const;

export const processingMotion = {
  typewriterSpeed: 40,
  chipTransitionDelay: 1500,
  progressDuration: 6000,
  spinnerSpeed: 1200,
} as const;

export const onboardingMotion = {
  cardSelect: { damping: 15, stiffness: 150 },
  dotExpand: { damping: 12, stiffness: 180 },
  staggerBase: 86,
  staggerCard: 50,
} as const;

export const darkStoryMotion = {
  ghostEnter: FadeIn.delay(80).duration(280),
  contentEnter: (delay = 0) => FadeInUp.delay(delay).duration(480),
  wordEnter: (delay = 0) => FadeInUp.delay(delay).duration(420),
  ctaEnter: FadeInUp.delay(820).duration(380),
  glowPulseDuration: 1600,
  ghostOpacity: 0.28,
  wordStagger: 70,
} as const;

