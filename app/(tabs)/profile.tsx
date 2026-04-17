import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInLeft, FadeInUp } from "react-native-reanimated";
import { ProfileHeroCard } from "@/src/components/profile/ProfileHeroCard";
import { PremiumUpgradeCard } from "@/src/components/profile/PremiumUpgradeCard";
import { UnifiedStatsSection } from "@/src/components/profile/UnifiedStatsSection";
import {
  CaretRight,
  CreditCard,
  Crown,
  Globe,
  Microphone,
  Palette,
  Question,
  Shield,
  SignOut,
  Scroll,
  Timer,
} from "phosphor-react-native";

import { useSessionStore } from "@state/useSessionStore";
import { useFTUEStore } from "@state/useFTUEStore";
import { useTodoStore } from "@state/useTodoStore";
import { useFocusStore } from "@/src/state/useFocusStore";
import { useRevenueCat } from "@/src/hooks/useRevenueCat";
import { useProfileGallery } from "@/src/hooks/useProfileGallery";
import { useUserScore } from "@/src/hooks/useUserScore";
import { NotificationPreferences } from "@/src/components/NotificationPreferences";
import { SegmentedControl } from "@/src/components/SegmentedControl";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";
import { supabase } from "@/src/services/supabase";

type SettingItem = {
  key: string;
  label: string;
  icon: typeof CreditCard;
  action?: string;
};

const SETTINGS_PREMIUM: SettingItem[] = [
  { key: "subscription", label: "Aboneliği yönet", icon: CreditCard, action: "subscription" },
];

const SETTINGS_OTHER: SettingItem[] = [
  { key: "language", label: "Dil", icon: Globe },
  { key: "privacy", label: "Gizlilik politikası", icon: Shield },
  { key: "terms", label: "Kullanım koşulları", icon: Scroll },
  { key: "support", label: "Destek", icon: Question },
];

const PLAN_LABELS: Record<string, string> = {
  weekly: "Haftalık",
  monthly: "Aylık",
  yearly: "Yıllık",
};

const PROFILE_SEGMENTS = [
  { key: "profile", label: "Profil" },
  { key: "gallery", label: "Galeri" },
  { key: "settings", label: "Ayarlar" },
];


const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
// ProfileHeroCard, PremiumUpgradeCard, UnifiedStatsSection are imported from
// src/components/profile/ — SettingRow and SettingsGroup stay local (profile-specific styles)

const SettingRow = ({
  item,
  isLast,
  onPress,
  badge,
}: {
  item: SettingItem;
  isLast: boolean;
  onPress: () => void;
  badge?: string;
}) => {
  const Icon = item.icon;
  return (
    <TouchableOpacity
      style={[styles.settingRow, !isLast && styles.settingBorder]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <View style={styles.settingIconWrap}>
        <Icon size={16} color="#7A6A60" weight="regular" />
      </View>
      <Text style={styles.settingLabel}>{item.label}</Text>
      {badge ? (
        <View style={styles.soonBadge}>
          <Text style={styles.soonBadgeText}>{badge}</Text>
        </View>
      ) : (
        <CaretRight size={14} color="#C8BDB5" />
      )}
    </TouchableOpacity>
  );
};

const SettingsGroup = ({
  title,
  items,
  onPress,
  delay = 0,
}: {
  title: string;
  items: SettingItem[];
  onPress: (action?: string) => void;
  delay?: number;
}) => (
  <Animated.View entering={FadeInLeft.delay(delay).duration(300)}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={[styles.settingsCard, shadow.card]}>
      {items.map((item, index) => (
        <SettingRow
          key={item.key}
          item={item}
          isLast={index === items.length - 1}
          onPress={() => onPress(item.action)}
        />
      ))}
    </View>
  </Animated.View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState("profile");
  const { profileName, profilePhoto, isPremium, signOut } = useSessionStore();
  const resetFTUE = useFTUEStore((s) => s.resetFTUE);
  const { todos } = useTodoStore();
  const { totalFocusMinutesToday } = useFocusStore();
  const { totalPoints } = useUserScore();
  const { planType, expirationDate, trialActive } = useRevenueCat();
  const { items: galleryItems, isLoading, error, refresh } = useProfileGallery();
  const [focusStreak, setFocusStreak] = useState(0);

  const visibleTodos = todos.filter((t) => t.deletedAt == null);
  const completed = visibleTodos.filter((t) => t.isCompleted).length;
  const planLabel = planType ? PLAN_LABELS[planType] ?? planType : null;

  useEffect(() => {
    const loadStreak = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase
          .from("users")
          .select("focus_streak")
          .eq("id", session.user.id)
          .single();
        if (data?.focus_streak) setFocusStreak(data.focus_streak);
      } catch {}
    };
    loadStreak();
  }, []);

  const handleSettingPress = useCallback(
    (action?: string) => {
      if (action === "subscription") {
        if (isPremium) {
          Linking.openURL("https://apps.apple.com/account/subscriptions");
        } else {
          router.push("/paywall");
        }
      }
    },
    [isPremium],
  );

  const getBadgeText = (): string => {
    if (!isPremium) return "Ücretsiz";
    if (trialActive) return "Deneme";
    if (planLabel) return `Pro · ${planLabel}`;
    return "Pro";
  };

  const getAIStatusText = (): string => {
    if (!isPremium) return "Premium ile AI görsel oluştur";
    if (profilePhoto) return "AI profil hazır";
    return "İlk görsel için fotoğraf ekle";
  };

  const handleMicPermission = async () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.screenTitle}>Profil</Text>
        <View style={styles.segmentWrap}>
          <SegmentedControl
            segments={PROFILE_SEGMENTS}
            activeKey={activeTab}
            onSelect={setActiveTab}
          />
        </View>

        {activeTab === "profile" && (
          <>
            <ProfileHeroCard
              profilePhoto={profilePhoto}
              profileName={profileName}
              isPremium={isPremium}
              badgeText={getBadgeText()}
              aiStatusText={getAIStatusText()}
            />

            {!isPremium && (
              <PremiumUpgradeCard onPress={() => router.push("/paywall")} />
            )}

            {isPremium && (trialActive || expirationDate) && (
              <Animated.View
                entering={FadeIn.delay(60).duration(280)}
                style={[styles.subscriptionInfo, shadow.card]}
              >
                <View style={styles.subscriptionInfoLeft}>
                  <Crown size={13} color="#C4962A" weight="fill" />
                  {trialActive && expirationDate ? (
                    <Text style={styles.subscriptionInfoText}>
                      Deneme {formatDate(expirationDate)} tarihine kadar
                    </Text>
                  ) : expirationDate ? (
                    <Text style={styles.subscriptionInfoText}>
                      Yenileme {formatDate(expirationDate)}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL("https://apps.apple.com/account/subscriptions")
                  }
                  accessibilityRole="link"
                  accessibilityLabel="Apple abonelik yönetimi"
                >
                  <Text style={styles.manageLink}>Yönet</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            <UnifiedStatsSection
              points={totalPoints}
              completed={completed}
              streak={focusStreak}
              focusMinutes={totalFocusMinutesToday}
            />

            {isPremium && (
              <SettingsGroup
                title="Abonelik"
                items={SETTINGS_PREMIUM}
                onPress={handleSettingPress}
                delay={160}
              />
            )}

            <SettingsGroup
              title="Diğer"
              items={SETTINGS_OTHER}
              onPress={handleSettingPress}
              delay={200}
            />
          </>
        )}

        {activeTab === "gallery" && (
          <View style={styles.gallerySection}>
            {isLoading ? (
              <View style={styles.galleryStateCard}>
                <ActivityIndicator size="small" color="#3A2E28" />
                <Text style={styles.galleryStateText}>Galeri yükleniyor...</Text>
              </View>
            ) : error ? (
              <View style={styles.galleryStateCard}>
                <Text style={styles.galleryStateText}>Galeri yüklenemedi.</Text>
                <TouchableOpacity
                  onPress={refresh}
                  style={styles.retryButton}
                  accessibilityRole="button"
                >
                  <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                </TouchableOpacity>
              </View>
            ) : galleryItems.length === 0 ? (
              <View style={styles.galleryStateCard}>
                <Text style={styles.galleryStateText}>
                  Henüz üretilen görsel yok. Görevlerini tamamla ve ilk görselini oluştur!
                </Text>
              </View>
            ) : (
              <View style={styles.galleryGrid}>
                {galleryItems.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInUp.delay(index * 80).duration(300)}
                    style={[styles.galleryCard, shadow.card]}
                  >
                    <Image source={{ uri: item.imageUrl }} style={styles.galleryImage} />
                    <View style={styles.galleryMeta}>
                      <Text style={styles.galleryType}>
                        {item.type === "avatar" ? "Avatar" : "Görsel"}
                      </Text>
                      <Text style={styles.galleryDate}>
                        {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === "settings" && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.settingsSection}>
            <NotificationPreferences />

            <Text style={styles.sectionTitle}>İzinler</Text>
            <View style={[styles.settingsCard, shadow.card]}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={handleMicPermission}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <View style={styles.settingIconWrap}>
                  <Microphone size={16} color="#7A6A60" weight="regular" />
                </View>
                <Text style={styles.settingLabel}>Mikrofon izni</Text>
                <CaretRight size={14} color="#C8BDB5" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Görünüm</Text>
            <View style={[styles.settingsCard, shadow.card]}>
              <SettingRow
                item={{ key: "style", label: "Sanat stilini değiştir", icon: Palette }}
                isLast={false}
                badge="Yakında"
                onPress={() => {
                  Alert.alert("Yakında", "Farklı sanat stilleri seçimi yakında geliyor.", [{ text: "Tamam" }]);
                }}
              />
              <SettingRow
                item={{ key: "frequency", label: "Üretim sıklığı", icon: Timer }}
                isLast={false}
                badge="Yakında"
                onPress={() => {
                  Alert.alert("Yakında", "Görsel üretim sıklığını özelleştirme yakında geliyor.", [{ text: "Tamam" }]);
                }}
              />
              <SettingRow
                item={{ key: "language", label: "Dil", icon: Globe }}
                isLast
                badge="Yakında"
                onPress={() => {
                  Alert.alert("Yakında", "Dil seçenekleri yakında eklenecek.", [{ text: "Tamam" }]);
                }}
              />
            </View>
          </Animated.View>
        )}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert(
              "Çıkış Yap",
              "Tüm verileriniz sıfırlanacak. Emin misiniz?",
              [
                { text: "İptal", style: "cancel" },
                {
                  text: "Çıkış Yap",
                  style: "destructive",
                  onPress: () => {
                    resetFTUE();
                    signOut();
                    router.replace("/");
                  },
                },
              ],
            );
          }}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <SignOut size={16} color="#C86A62" weight="regular" />
          <Text style={styles.logoutText}>Çıkış yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Layout
  safeArea: {
    flex: 1,
    backgroundColor: semantic.appBackground,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },

  // Header
  screenTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    color: "#3A2E28",
    letterSpacing: -0.5,
    paddingTop: spacing.md,
    marginBottom: spacing.sm,
  },
  segmentWrap: {
    marginBottom: spacing.lg,
  },

  // Profile Hero Card
  heroCard: {
    borderRadius: radius.xl,
    backgroundColor: "#FDFAF6",
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  heroAvatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "#EDE5D8",
    overflow: "hidden",
  },
  heroAvatar: {
    width: "100%",
    height: "100%",
  },
  heroAvatarPlaceholder: {
    backgroundColor: "#EDE5D8",
    alignItems: "center",
    justifyContent: "center",
  },
  heroAvatarInitial: {
    color: "#3A2E28",
    fontSize: 28,
    fontWeight: "700",
  },
  heroInfo: {
    flex: 1,
    gap: 5,
  },
  heroName: {
    fontSize: 22,
    lineHeight: 26,
    color: "#3A2E28",
    fontWeight: "700",
  },
  planBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    backgroundColor: "#F2EEE8",
    paddingHorizontal: 10,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  planBadgePro: {
    backgroundColor: "#202126",
  },
  planBadgeText: {
    color: "#6B5B52",
    fontSize: 11,
    fontWeight: "600",
  },
  planBadgeTextPro: {
    color: semantic.textOnDark,
  },
  heroStatusText: {
    fontSize: 12,
    color: "#9E8E84",
    fontWeight: "400",
  },

  // Premium Upgrade Card
  upgradeCard: {
    borderRadius: radius.xl,
    backgroundColor: "#FDFAF6",
    borderWidth: 1,
    borderColor: "#EDE5D8",
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  upgradeTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  upgradeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#FEF7E7",
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeTopText: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3A2E28",
    lineHeight: 19,
  },
  upgradeSubtitle: {
    fontSize: 12,
    color: "#9E8E84",
    fontWeight: "400",
    marginTop: 1,
  },
  upgradeBenefitsList: {
    gap: 7,
    paddingLeft: 2,
  },
  upgradeBenefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  upgradeBenefitDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C4962A",
  },
  upgradeBenefitText: {
    fontSize: 13,
    color: "#6B5B52",
    fontWeight: "500",
  },
  upgradeCTA: {
    borderRadius: radius.md,
    backgroundColor: "#3A2E28",
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 2,
  },
  upgradeCTAText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },

  // Subscription Info (premium)
  subscriptionInfo: {
    borderRadius: radius.lg,
    backgroundColor: "#FDFAF6",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  subscriptionInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  subscriptionInfoText: {
    fontSize: 13,
    color: "#6B5B52",
    fontWeight: "500",
    flex: 1,
  },
  manageLink: {
    fontSize: 13,
    color: semantic.accent,
    fontWeight: "700",
  },

  // Unified Stats Section
  statsContainer: {
    borderRadius: radius.xl,
    backgroundColor: "#FDFAF6",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  statColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#3A2E28",
    lineHeight: 26,
  },
  statLabel: {
    fontSize: 10,
    color: "#9E8E84",
    fontWeight: "500",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: "#EDE5D8",
  },

  // Section title (shared)
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B2A498",
    letterSpacing: 0.4,
    marginBottom: 6,
    marginLeft: 4,
  },

  // Settings
  settingsCard: {
    borderRadius: radius.xl,
    backgroundColor: "#FDFAF6",
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  prefsCard: {
    borderRadius: radius.xl,
    backgroundColor: "#FDFAF6",
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  settingsSection: {
    gap: spacing.xs,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  settingBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  settingIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F5F1EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  soonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#F0EDE8",
  },
  soonBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9A8880",
    letterSpacing: 0.2,
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    color: "#3A2E28",
    fontWeight: "500",
  },

  // Gallery
  gallerySection: {
    marginBottom: spacing.lg,
  },
  galleryStateCard: {
    borderRadius: radius.lg,
    backgroundColor: "#FDFAF6",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    gap: 10,
  },
  galleryStateText: {
    fontSize: 14,
    color: "#6B5B52",
    fontWeight: "500",
    textAlign: "center",
  },
  retryButton: {
    borderRadius: radius.md,
    backgroundColor: "#3A2E28",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  galleryCard: {
    width: "48%",
    borderRadius: radius.lg,
    backgroundColor: "#FDFAF6",
    overflow: "hidden",
  },
  galleryImage: {
    width: "100%",
    aspectRatio: 1,
  },
  galleryMeta: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  galleryType: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3A2E28",
  },
  galleryDate: {
    fontSize: 11,
    color: "#8A7A70",
  },

  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.lg,
    backgroundColor: "#FDF5F3",
    borderWidth: 1,
    borderColor: "#E8C5BE",
    paddingVertical: 15,
    marginTop: spacing.xs,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C86A62",
  },
});
