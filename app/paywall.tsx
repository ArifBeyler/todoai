import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Check, ShieldCheck, X } from "phosphor-react-native";
import { useRevenueCat } from "@/src/hooks/useRevenueCat";
import { useFTUEStore } from "@state/useFTUEStore";
import { palette, radius, semantic, shadow, spacing } from "@/src/ui/tokens";

const TRIAL_FEATURES = [
  "Kişisel AI görsel üretimi",
  "Günlük motivasyon kartları",
  "Tüm pastel stillere erişim",
  "HD dışa aktarma",
  "Öncelikli üretim sırası",
  "Sınırsız geçmiş arşivi",
];

const plans = [
  {
    id: "weekly",
    title: "Haftalık",
    price: "149,99 TL",
    subtitle: "hafta başına",
  },
  {
    id: "monthly",
    title: "Aylık",
    price: "299,99 TL",
    subtitle: "ay başına",
    popular: true,
  },
  {
    id: "yearly",
    title: "Yıllık",
    price: "1.999,99 TL",
    subtitle: "yıl başına",
    save: "%44 tasarruf",
  },
];

export default function PaywallScreen() {
  const { purchaseTrial, restorePurchases } = useRevenueCat();
  const dismissPaywall = useFTUEStore((s) => s.dismissPaywall);

  const handleStartTrial = async () => {
    await purchaseTrial();
    router.back();
  };

  const handleDismiss = () => {
    dismissPaywall();
    router.back();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 42 }}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.close}
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
          hitSlop={12}
        >
          <X size={16} color={semantic.textOnDark} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DayFrame Pro</Text>
        <Text style={styles.headerSubtitle}>
          7 gün ücretsiz dene, farkı hisset.
        </Text>
      </View>

      <View style={[styles.trialBanner, shadow.card]}>
        <ShieldCheck size={24} color={semantic.success} weight="fill" />
        <View style={{ flex: 1 }}>
          <Text style={styles.trialBannerTitle}>7 gün tamamen ücretsiz</Text>
          <Text style={styles.trialBannerSub}>
            Deneme süresi bitene kadar ücret alınmaz. İstediğin an iptal et.
          </Text>
        </View>
      </View>

      <View style={[styles.sectionCard, shadow.card]}>
        {TRIAL_FEATURES.map((item) => (
          <View key={item} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Check
                size={13}
                color={semantic.textOnDark}
                weight="bold"
              />
            </View>
            <Text style={styles.featureText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.planList}>
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              plan.popular && styles.planCardPopular,
              shadow.card,
            ]}
            onPress={handleStartTrial}
            activeOpacity={0.86}
            accessibilityRole="button"
            accessibilityLabel={`${plan.title} planını seç`}
          >
            {plan.popular ? (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>En Popüler</Text>
              </View>
            ) : null}
            {plan.save ? (
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>{plan.save}</Text>
              </View>
            ) : null}
            <Text
              style={[
                styles.planTitle,
                plan.popular && styles.planTitlePopular,
              ]}
            >
              {plan.title}
            </Text>
            <Text
              style={[
                styles.planPrice,
                plan.popular && styles.planPricePopular,
              ]}
            >
              {plan.price}
            </Text>
            <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.subscribeButton, shadow.soft]}
          onPress={handleStartTrial}
          accessibilityRole="button"
          accessibilityLabel="7 gün ücretsiz deneyi başlat"
        >
          <Text style={styles.subscribeButtonText}>
            7 Gün Ücretsiz Dene
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.freeButton}
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Ücretsiz devam et"
        >
          <Text style={styles.freeButtonText}>
            Şimdilik Ücretsiz Devam Et
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={restorePurchases}
          accessibilityRole="button"
        >
          <Text style={styles.restoreButtonText}>
            Satın Alımları Geri Yükle
          </Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          Abonelik otomatik yenilenir. 7 günlük deneme süresi boyunca ücret
          alınmaz. Dilediğiniz zaman iptal edebilirsiniz.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: semantic.appBackground },
  header: {
    backgroundColor: palette.steelTeal,
    paddingHorizontal: spacing.xl,
    paddingTop: 66,
    paddingBottom: 34,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  close: {
    position: "absolute",
    right: spacing.md,
    top: spacing.md + 40,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  headerTitle: {
    fontSize: 34,
    lineHeight: 36,
    fontWeight: "700",
    color: semantic.textOnDark,
  },
  headerSubtitle: {
    marginTop: spacing.xs,
    fontSize: 15,
    color: "rgba(255,247,239,0.88)",
  },
  trialBanner: {
    marginTop: spacing.md,
    marginHorizontal: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: "#E8F5EC",
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  trialBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: semantic.textPrimary,
  },
  trialBannerSub: {
    marginTop: 2,
    fontSize: 13,
    color: semantic.textSecondary,
    lineHeight: 18,
  },
  sectionCard: {
    marginTop: spacing.md,
    marginHorizontal: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: semantic.screenSurface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 15,
    color: semantic.textPrimary,
    fontWeight: "500",
  },
  planList: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  planCard: {
    borderRadius: radius.lg,
    backgroundColor: semantic.screenSurface,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: semantic.border,
  },
  planCardPopular: {
    borderColor: semantic.heroStart,
    backgroundColor: "#EAEAEA",
  },
  popularBadge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: semantic.heroStart,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderTopRightRadius: radius.lg,
    borderBottomLeftRadius: radius.sm,
  },
  popularBadgeText: {
    color: semantic.textOnDark,
    fontSize: 11,
    fontWeight: "700",
  },
  saveBadge: {
    position: "absolute",
    top: 10,
    right: 12,
    borderRadius: radius.pill,
    backgroundColor: semantic.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  saveBadgeText: {
    color: semantic.textOnDark,
    fontSize: 11,
    fontWeight: "700",
  },
  planTitle: {
    fontSize: 16,
    color: semantic.textSecondary,
    fontWeight: "700",
  },
  planTitlePopular: { color: semantic.heroStart },
  planPrice: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: "700",
    color: semantic.textPrimary,
  },
  planPricePopular: { color: semantic.heroStart },
  planSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: semantic.textSecondary,
  },
  footer: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  subscribeButton: {
    borderRadius: radius.lg,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
  },
  subscribeButtonText: {
    color: semantic.textOnDark,
    fontSize: 16,
    fontWeight: "700",
  },
  freeButton: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: semantic.border,
  },
  freeButtonText: {
    color: semantic.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  restoreButton: { alignItems: "center", paddingVertical: 6 },
  restoreButtonText: {
    color: semantic.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  legal: {
    fontSize: 12,
    color: semantic.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
});
