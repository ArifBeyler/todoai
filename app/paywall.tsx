import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageSourcePropType,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import type { PurchasesPackage } from "react-native-purchases";
import { Check, Crown, ShieldCheck, Sparkle, Star, X } from "phosphor-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRevenueCat } from "@/src/hooks/useRevenueCat";
import { useFTUEStore } from "@state/useFTUEStore";
import { useSessionStore } from "@state/useSessionStore";
import { trackEvent } from "@/src/services/analytics";
import { font, radius, semantic, shadow, spacing } from "@/src/ui/tokens";

const { width: SCREEN_W } = Dimensions.get("window");

const CAROUSEL_IMAGES: ImageSourcePropType[] = [
  require("../assets/images/onboarding-hero-lofi.png"),
  require("../assets/images/onboarding-cooking-lofi.png"),
  require("../assets/images/onboarding-study-3d.png"),
  require("../assets/images/onboarding-sport-3d.png"),
  require("../assets/images/onboarding-welcome.png"),
  require("../assets/images/onboarding-distracted.png"),
  require("../assets/images/onboarding-solution.png"),
  require("../assets/images/onboarding-app-reveal.png"),
  require("../assets/images/onboarding-overwhelmed.png"),
];

const CAROUSEL_INTERVAL = 3500;

const FEATURES = [
  { label: "Kişisel AI görsel üretimi", icon: "sparkle" },
  { label: "Günlük motivasyon kartları", icon: "check" },
  { label: "Tüm pastel stillere erişim", icon: "check" },
  { label: "HD dışa aktarma", icon: "check" },
  { label: "Öncelikli üretim sırası", icon: "check" },
  { label: "Sınırsız geçmiş arşivi", icon: "check" },
] as const;

const PACKAGE_ORDER: Record<string, number> = {
  $rc_weekly: 0,
  $rc_monthly: 1,
  $rc_annual: 2,
};

const PACKAGE_LABELS: Record<string, string> = {
  $rc_weekly: "Haftalık",
  $rc_monthly: "Aylık",
  $rc_annual: "Yıllık",
};

const getPackageSubtitle = (identifier: string): string => {
  switch (identifier) {
    case "$rc_weekly":
      return "hafta başına";
    case "$rc_monthly":
      return "ay başına";
    case "$rc_annual":
      return "yıl başına";
    default:
      return "";
  }
};

const isPopular = (identifier: string): boolean =>
  identifier === "$rc_monthly";

const getYearlySavings = (packages: PurchasesPackage[]): string | null => {
  const monthly = packages.find((p) => p.identifier === "$rc_monthly");
  const annual = packages.find((p) => p.identifier === "$rc_annual");
  if (!monthly || !annual) return null;

  const yearlyFromMonthly = monthly.product.price * 12;
  const annualPrice = annual.product.price;
  if (yearlyFromMonthly <= 0) return null;

  const savingsPercent = Math.round(
    ((yearlyFromMonthly - annualPrice) / yearlyFromMonthly) * 100,
  );
  return savingsPercent > 0 ? `%${savingsPercent} tasarruf` : null;
};

const HERO_SHADOW = Platform.select({
  ios: {
    shadowColor: "rgba(0,0,0,0.18)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 28,
  },
  android: { elevation: 16 },
}) as object;

const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: "rgba(0,0,0,0.08)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  android: { elevation: 6 },
}) as object;

function CarouselHero({ isSoftMode, isHardMode, hasIntroOffer, onDismiss }: {
  isSoftMode: boolean;
  isHardMode: boolean;
  hasIntroOffer: boolean;
  onDismiss: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      fadeAnim.value = withSequence(
        withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 400, easing: Easing.in(Easing.ease) }),
      );
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
      }, 400);
    }, CAROUSEL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const imageStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const title = isHardMode
    ? "Avatarın hazır!\nPremium ile devam et"
    : isSoftMode
      ? "Premium ile daha\nfazlasını keşfet"
      : hasIntroOffer
        ? "7 gün ücretsiz dene"
        : "Premium özelliklerin\nkilidini aç";

  return (
    <Animated.View
      entering={FadeInDown.duration(600).springify().damping(18)}
      style={styles.heroWrap}
    >
      <View style={[styles.heroCard, HERO_SHADOW]}>
        <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
          <Image
            source={CAROUSEL_IMAGES[activeIndex]}
            style={styles.heroImage}
          />
        </Animated.View>

        <LinearGradient
          colors={[
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0.02)",
            "rgba(0,0,0,0.55)",
          ]}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.heroOverlay}>
          <View style={styles.heroBadge}>
            <Sparkle size={13} color="#FFFFFF" weight="fill" />
            <Text style={styles.heroBadgeText}>Doara Pro</Text>
          </View>
          <Text style={styles.heroTitle}>{title}</Text>
        </View>

        <View style={styles.dotsRow}>
          {CAROUSEL_IMAGES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.closeButton}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Kapat"
        hitSlop={12}
      >
        <X size={14} color="#FFF" weight="bold" />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PaywallScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isSoftMode = mode === "soft";
  const isHardMode = mode === "hard";

  const {
    packages,
    isLoading,
    isPurchasing,
    isRestoring,
    purchasePackage,
    restorePurchases,
  } = useRevenueCat();
  const dismissPaywall = useFTUEStore((s) => s.dismissPaywall);
  const completeAccountGate = useFTUEStore((s) => s.completeAccountGate);
  const onboardingCompleted = useSessionStore((s) => s.onboardingCompleted);
  const completeOnboarding = useSessionStore((s) => s.completeOnboarding);
  const isOnboardingFlow = !onboardingCompleted;

  const sortedPackages = [...packages].sort(
    (a, b) =>
      (PACKAGE_ORDER[a.identifier] ?? 99) -
      (PACKAGE_ORDER[b.identifier] ?? 99),
  );

  const [selectedPkgId, setSelectedPkgId] = useState<string>("$rc_monthly");

  const selectedPkg =
    sortedPackages.find((p) => p.identifier === selectedPkgId) ??
    sortedPackages[0];

  useEffect(() => {
    trackEvent("paywall_viewed");
  }, []);

  const yearlySavings = getYearlySavings(sortedPackages);

  const hasIntroOffer = selectedPkg?.product.introPrice != null;
  const introLabel = hasIntroOffer
    ? `${selectedPkg.product.introPrice!.periodNumberOfUnits} gün ücretsiz dene`
    : null;

  const handlePlanSelect = useCallback((pkgId: string) => {
    setSelectedPkgId(pkgId);
    trackEvent("paywall_plan_selected", { planId: pkgId });
  }, []);

  const handlePurchase = useCallback(async () => {
    if (!selectedPkg || isPurchasing) return;

    trackEvent("paywall_purchase_started", {
      planId: selectedPkg.identifier,
      price: selectedPkg.product.priceString,
    });

    const result = await purchasePackage(selectedPkg);

    if (result.success) {
      trackEvent("paywall_purchase_completed", {
        planId: selectedPkg.identifier,
      });
      if (isSoftMode) {
        // Soft paywall in onboarding: show the premium activation bridge
        router.replace("/premium-bridge");
      } else if (isHardMode) {
        completeOnboarding();
        // Hard paywall (post-onboarding): bridge then home
        router.replace("/premium-bridge");
      } else if (isOnboardingFlow) {
        // Mid-onboarding purchase: bridge leads to photo upload
        router.replace("/premium-bridge");
      } else {
        // In-app upgrade: bridge celebrates and leads to photo personalisation
        router.replace("/premium-bridge");
      }
      return;
    }

    if (result.cancelled) {
      trackEvent("paywall_purchase_cancelled", {
        planId: selectedPkg.identifier,
      });
    } else if (result.error) {
      trackEvent("paywall_purchase_failed", {
        planId: selectedPkg.identifier,
        error: result.error,
      });
      Alert.alert(
        "Satın Alma Başarısız",
        "Bir sorun oluştu, lütfen tekrar deneyin.",
        [{ text: "Tamam" }],
      );
    }
  }, [selectedPkg, isPurchasing, purchasePackage]);

  const handleRestore = useCallback(async () => {
    if (isRestoring) return;

    trackEvent("paywall_restore_tapped");
    const result = await restorePurchases();

    if (result.success) {
      trackEvent("paywall_restore_success");
      if (isSoftMode) {
        Alert.alert("Başarılı", "Aboneliğiniz geri yüklendi.", [
          { text: "Tamam", onPress: () => router.replace("/(onboarding)/subscription-success") },
        ]);
      } else if (isHardMode) {
        Alert.alert("Başarılı", "Aboneliğiniz geri yüklendi.", [
          {
            text: "Tamam",
            onPress: () => {
              completeOnboarding();
              router.replace("/(tabs)/home");
            },
          },
        ]);
      } else if (isOnboardingFlow) {
        Alert.alert("Başarılı", "Aboneliğiniz geri yüklendi.", [
          {
            text: "Tamam",
            onPress: () => router.replace("/(onboarding)/photo"),
          },
        ]);
      } else {
        Alert.alert("Başarılı", "Aboneliğiniz geri yüklendi.", [
          { text: "Tamam", onPress: () => router.back() },
        ]);
      }
      return;
    }

    trackEvent("paywall_restore_failed");
    Alert.alert("Geri Yükleme", "Aktif bir abonelik bulunamadı.", [
      { text: "Tamam" },
    ]);
  }, [isRestoring, restorePurchases]);

  const handleDismiss = () => {
    trackEvent("paywall_dismissed");
    dismissPaywall();
    if (isSoftMode) {
      completeAccountGate(true);
      router.replace("/(onboarding)/photo");
    } else if (isHardMode) {
      completeOnboarding();
      router.replace("/(tabs)/home");
    } else if (isOnboardingFlow) {
      completeOnboarding();
      router.replace("/(tabs)/home");
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={semantic.heroStart} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <CarouselHero
        isSoftMode={isSoftMode}
        isHardMode={isHardMode}
        hasIntroOffer={hasIntroOffer}
        onDismiss={handleDismiss}
      />

      {/* Trial Banner */}
      {hasIntroOffer && (
        <Animated.View
          entering={FadeInUp.delay(200).duration(400)}
          style={[styles.trialBanner, CARD_SHADOW]}
        >
          <View style={styles.trialIconWrap}>
            <ShieldCheck size={18} color="#FFFFFF" weight="fill" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.trialTitle}>7 gün tamamen ücretsiz</Text>
            <Text style={styles.trialSub}>
              Deneme süresi bitene kadar ücret alınmaz.
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Features */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(450)}
        style={[styles.featuresCard, CARD_SHADOW]}
      >
        {FEATURES.map((item, i) => (
          <Animated.View
            key={item.label}
            entering={FadeIn.delay(400 + i * 60).duration(300)}
            style={styles.featureRow}
          >
            <View style={[
              styles.featureIcon,
              item.icon === "sparkle" && styles.featureIconAccent,
            ]}>
              {item.icon === "sparkle" ? (
                <Sparkle size={11} color="#FFF" weight="fill" />
              ) : (
                <Check size={11} color="#FFF" weight="bold" />
              )}
            </View>
            <Text style={styles.featureText}>{item.label}</Text>
          </Animated.View>
        ))}
      </Animated.View>

      {/* Plans */}
      <View style={styles.planList}>
        {sortedPackages.map((pkg, i) => {
          const selected = pkg.identifier === selectedPkgId;
          const popular = isPopular(pkg.identifier);
          const showSave =
            pkg.identifier === "$rc_annual" && yearlySavings;

          return (
            <Animated.View
              key={pkg.identifier}
              entering={FadeInUp.delay(450 + i * 80).duration(380)}
            >
              <TouchableOpacity
                style={[
                  styles.planCard,
                  CARD_SHADOW,
                  selected && styles.planCardSelected,
                ]}
                onPress={() => handlePlanSelect(pkg.identifier)}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${PACKAGE_LABELS[pkg.identifier] ?? pkg.identifier} planını seç`}
              >
                <View
                  style={[
                    styles.radioOuter,
                    selected && styles.radioOuterSelected,
                  ]}
                >
                  {selected && (
                    <Animated.View
                      entering={ZoomIn.duration(200)}
                      style={styles.radioInner}
                    />
                  )}
                </View>

                <View style={styles.planInfo}>
                  <Text
                    style={[
                      styles.planName,
                      selected && styles.planNameSelected,
                    ]}
                  >
                    {PACKAGE_LABELS[pkg.identifier] ?? pkg.identifier}
                  </Text>
                  {popular && (
                    <View style={styles.popularBadge}>
                      <Crown size={9} color="#FFF" weight="fill" />
                      <Text style={styles.popularText}>En Popüler</Text>
                    </View>
                  )}
                  {showSave && (
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveText}>{yearlySavings}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.planPriceWrap}>
                  <Text
                    style={[
                      styles.planPrice,
                      selected && styles.planPriceSelected,
                    ]}
                  >
                    {pkg.product.priceString}
                  </Text>
                  <Text style={styles.planPeriod}>
                    {getPackageSubtitle(pkg.identifier)}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* CTA */}
      <Animated.View
        entering={FadeInUp.delay(700).duration(400)}
        style={styles.ctaSection}
      >
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            (isPurchasing || isRestoring) && styles.disabled,
          ]}
          onPress={handlePurchase}
          disabled={isPurchasing || isRestoring}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={introLabel ?? "Abone ol"}
        >
          {isPurchasing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Sparkle size={18} color="#FFF" weight="fill" />
              <Text style={styles.subscribeText}>
                {introLabel ?? "Abone Ol"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.freeButton}
          onPress={handleDismiss}
          disabled={isPurchasing}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Ücretsiz devam et"
        >
          <Text style={styles.freeText}>Şimdilik Ücretsiz Devam Et</Text>
        </TouchableOpacity>

        <View style={styles.footerLinks}>
          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={handleRestore}
            disabled={isPurchasing || isRestoring}
            accessibilityRole="button"
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={semantic.textSecondary} />
            ) : (
              <Text style={styles.restoreText}>Geri Yükle</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerDot} />
          <TouchableOpacity accessibilityRole="link">
            <Text style={styles.restoreText}>Gizlilik</Text>
          </TouchableOpacity>
          <View style={styles.footerDot} />
          <TouchableOpacity accessibilityRole="link">
            <Text style={styles.restoreText}>Kullanım Şartları</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>
          Abonelik otomatik yenilenir.{" "}
          {hasIntroOffer
            ? "7 günlük deneme süresi boyunca ücret alınmaz. "
            : ""}
          Dilediğiniz zaman iptal edebilirsiniz.
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.appBackground,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  heroWrap: {
    marginHorizontal: 20,
    marginTop: 56,
  },
  heroCard: {
    width: "100%",
    height: 260,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    gap: 10,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  heroBadgeText: {
    fontSize: 12,
    fontFamily: font.bold,
    fontWeight: "700",
    color: "#FFF",
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: font.extraBold,
    fontWeight: "800",
    color: "#FFF",
    lineHeight: 30,
    letterSpacing: -0.4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  dotsRow: {
    position: "absolute",
    bottom: 10,
    right: 16,
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: {
    width: 16,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  trialBanner: {
    marginTop: 16,
    marginHorizontal: 20,
    borderRadius: 18,
    backgroundColor: "#E8F5EC",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trialIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: semantic.success,
    alignItems: "center",
    justifyContent: "center",
  },
  trialTitle: {
    fontSize: 14,
    fontFamily: font.bold,
    fontWeight: "700",
    color: semantic.textPrimary,
  },
  trialSub: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    lineHeight: 16,
  },

  featuresCard: {
    marginTop: 16,
    marginHorizontal: 20,
    borderRadius: 22,
    backgroundColor: semantic.screenSurface,
    padding: 20,
    gap: 14,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
  },
  featureIconAccent: {
    backgroundColor: semantic.accent,
  },
  featureText: {
    fontSize: 15,
    fontFamily: font.medium,
    fontWeight: "500",
    color: semantic.textPrimary,
  },

  planList: {
    marginTop: 20,
    marginHorizontal: 20,
    gap: 10,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: semantic.screenSurface,
    borderWidth: 2,
    borderColor: "transparent",
  },
  planCardSelected: {
    borderColor: semantic.heroStart,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: semantic.heroStart,
    backgroundColor: semantic.heroStart,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },
  planInfo: {
    flex: 1,
    marginLeft: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  planName: {
    fontSize: 16,
    fontFamily: font.semiBold,
    fontWeight: "600",
    color: semantic.textSecondary,
  },
  planNameSelected: {
    color: semantic.textPrimary,
  },
  popularBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: semantic.heroStart,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  popularText: {
    fontSize: 10,
    fontFamily: font.bold,
    fontWeight: "700",
    color: "#FFF",
  },
  saveBadge: {
    backgroundColor: semantic.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  saveText: {
    fontSize: 10,
    fontFamily: font.bold,
    fontWeight: "700",
    color: "#FFF",
  },
  planPriceWrap: {
    alignItems: "flex-end",
  },
  planPrice: {
    fontSize: 18,
    fontFamily: font.bold,
    fontWeight: "700",
    color: semantic.textPrimary,
  },
  planPriceSelected: {
    color: semantic.heroStart,
  },
  planPeriod: {
    fontSize: 11,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    marginTop: 1,
  },

  ctaSection: {
    marginTop: 24,
    marginHorizontal: 20,
    gap: 12,
  },
  subscribeButton: {
    borderRadius: 18,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 18,
    minHeight: 56,
    ...Platform.select({
      ios: {
        shadowColor: semantic.heroStart,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
    }),
  },
  subscribeText: {
    color: "#FFF",
    fontSize: 17,
    fontFamily: font.bold,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  freeButton: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  freeText: {
    color: semantic.textSecondary,
    fontSize: 15,
    fontFamily: font.semiBold,
    fontWeight: "600",
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  restoreBtn: {
    minHeight: 24,
    justifyContent: "center",
  },
  restoreText: {
    color: semantic.textSecondary,
    fontSize: 12,
    fontFamily: font.medium,
    fontWeight: "500",
  },
  legal: {
    fontSize: 11,
    fontFamily: font.regular,
    color: "rgba(0,0,0,0.3)",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 4,
  },
  disabled: {
    opacity: 0.6,
  },
});
