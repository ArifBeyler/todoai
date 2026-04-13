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
import * as Notifications from "expo-notifications";
import {
  Bell,
  CaretRight,
  Clock,
  CreditCard,
  Crown,
  Gear,
  Globe,
  Lightning,
  Microphone,
  Palette,
  Question,
  Shield,
  SignOut,
  Scroll,
  Timer,
  Trophy,
  Fire,
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
  icon: typeof Gear;
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

const PREMIUM_FEATURES = [
  "Yapay zekâ ile kişisel görseller",
  "Sınırsız alışkanlık takibi",
  "Detaylı üretkenlik analizleri",
  "Öncelikli müşteri desteği",
];

const SettingRow = ({
  item,
  isLast,
  onPress,
}: {
  item: SettingItem;
  isLast: boolean;
  onPress: () => void;
}) => {
  const Icon = item.icon;
  return (
    <TouchableOpacity
      style={[styles.settingRow, !isLast && styles.settingBorder]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
    >
      <View style={styles.settingIconWrap}>
        <Icon size={18} color="#5C4E46" weight="regular" />
      </View>
      <Text style={styles.settingLabel}>{item.label}</Text>
      <CaretRight size={16} color="#B2A498" />
    </TouchableOpacity>
  );
};

const UpgradeCard = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity
    style={styles.upgradeCard}
    onPress={onPress}
    activeOpacity={0.88}
    accessibilityRole="button"
    accessibilityLabel="Premium'a yükselt"
  >
    <View style={styles.upgradeHeader}>
      <View style={styles.upgradeIconWrap}>
        <Crown size={20} color="#C4962A" weight="fill" />
      </View>
      <View style={styles.upgradeHeaderText}>
        <Text style={styles.upgradeTitle}>Premium'a Yükselt</Text>
        <Text style={styles.upgradeSubtitle}>Tüm özelliklerin kilidini aç</Text>
      </View>
      <CaretRight size={18} color="#C4962A" />
    </View>
    <View style={styles.upgradeFeatureList}>
      {PREMIUM_FEATURES.map((feature) => (
        <View key={feature} style={styles.upgradeFeatureRow}>
          <Lightning size={13} color="#C4962A" weight="fill" />
          <Text style={styles.upgradeFeatureText}>{feature}</Text>
        </View>
      ))}
    </View>
  </TouchableOpacity>
);

const StatCard = ({
  value,
  label,
  icon: Icon,
  iconColor,
  delay,
}: {
  value: string | number;
  label: string;
  icon: typeof Trophy;
  iconColor: string;
  delay: number;
}) => (
  <Animated.View entering={FadeInUp.delay(delay).duration(400)} style={[styles.statCard, shadow.card]}>
    <Icon size={20} color={iconColor} weight="fill" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Animated.View>
);

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState("profile");
  const { profileName, profilePhoto, isPremium, signOut } = useSessionStore();
  const resetFTUE = useFTUEStore((s) => s.resetFTUE);
  const { todos } = useTodoStore();
  const { totalFocusMinutesToday, sessionsCompleted } = useFocusStore();
  const { totalPoints } = useUserScore();
  const { planType, expirationDate, trialActive } = useRevenueCat();
  const { items: galleryItems, isLoading, error, refresh } = useProfileGallery();
  const [focusStreak, setFocusStreak] = useState(0);

  const completed = todos.filter((t) => t.isCompleted).length;
  const completionRate = todos.length ? Math.round((completed / todos.length) * 100) : 0;
  const planLabel = planType ? PLAN_LABELS[planType] ?? planType : null;

  useEffect(() => {
    const loadStreak = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
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

  const handleSettingPress = useCallback((action?: string) => {
    if (action === "subscription") {
      if (isPremium) {
        Linking.openURL("https://apps.apple.com/account/subscriptions");
      } else {
        router.push("/paywall");
      }
    }
  }, [isPremium]);

  const getBadgeText = (): string => {
    if (!isPremium) return "Ücretsiz";
    if (trialActive) return "Deneme";
    if (planLabel) return `Pro · ${planLabel}`;
    return "Pro";
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
            <Animated.View entering={FadeIn.duration(300)} style={[styles.profileCard, shadow.soft]}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {(profileName || "A")[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profileName || "Kullanıcı"}</Text>
                <View style={[styles.planBadge, isPremium && styles.planBadgePro]}>
                  {isPremium && <Crown size={12} color={semantic.textOnDark} weight="fill" />}
                  <Text style={[styles.planBadgeText, isPremium && styles.planBadgeTextPro]}>
                    {getBadgeText()}
                  </Text>
                </View>
              </View>
            </Animated.View>

            {!isPremium && <UpgradeCard onPress={() => router.push("/paywall")} />}

            {isPremium && (trialActive || expirationDate) && (
              <View style={[styles.subscriptionInfo, shadow.card]}>
                <View style={styles.subscriptionInfoLeft}>
                  <Crown size={14} color="#C4962A" weight="fill" />
                  {trialActive && expirationDate ? (
                    <Text style={styles.subscriptionInfoText}>
                      Deneme süresi {formatDate(expirationDate)} tarihine kadar
                    </Text>
                  ) : expirationDate ? (
                    <Text style={styles.subscriptionInfoText}>
                      Yenileme tarihi {formatDate(expirationDate)}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => Linking.openURL("https://apps.apple.com/account/subscriptions")}
                  accessibilityRole="link"
                  accessibilityLabel="Apple abonelik yönetimi"
                >
                  <Text style={styles.manageLink}>Yönet</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.statsRow}>
              <StatCard value={totalPoints} label="Puan" icon={Trophy} iconColor="#C4962A" delay={100} />
              <StatCard value={completed} label="Tamamlanan" icon={Lightning} iconColor={semantic.accent} delay={200} />
              <StatCard value={focusStreak} label="Seri" icon={Fire} iconColor="#E25C3E" delay={300} />
              <StatCard value={`${totalFocusMinutesToday}dk`} label="Bugün Odak" icon={Timer} iconColor="#5C7CAA" delay={400} />
            </View>

            {isPremium && (
              <>
                <Animated.Text entering={FadeInLeft.delay(200).duration(300)} style={styles.sectionTitle}>
                  Abonelik
                </Animated.Text>
                <View style={[styles.settingsCard, shadow.card]}>
                  {SETTINGS_PREMIUM.map((item, index) => (
                    <SettingRow
                      key={item.key}
                      item={item}
                      isLast={index === SETTINGS_PREMIUM.length - 1}
                      onPress={() => handleSettingPress(item.action)}
                    />
                  ))}
                </View>
              </>
            )}

            <Animated.Text entering={FadeInLeft.delay(300).duration(300)} style={styles.sectionTitle}>
              Diğer
            </Animated.Text>
            <View style={[styles.settingsCard, shadow.card]}>
              {SETTINGS_OTHER.map((item, index) => (
                <SettingRow
                  key={item.key}
                  item={item}
                  isLast={index === SETTINGS_OTHER.length - 1}
                  onPress={() => handleSettingPress(item.action)}
                />
              ))}
            </View>
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
            <Text style={styles.sectionTitle}>Bildirimler</Text>
            <View style={[styles.prefsCard, shadow.card]}>
              <NotificationPreferences />
            </View>

            <Text style={styles.sectionTitle}>İzinler</Text>
            <View style={[styles.settingsCard, shadow.card]}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={handleMicPermission}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <View style={styles.settingIconWrap}>
                  <Microphone size={18} color="#5C4E46" weight="regular" />
                </View>
                <Text style={styles.settingLabel}>Mikrofon izni</Text>
                <CaretRight size={16} color="#B2A498" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Görünüm</Text>
            <View style={[styles.settingsCard, shadow.card]}>
              <SettingRow
                item={{ key: "style", label: "Sanat stilini değiştir", icon: Palette }}
                isLast={false}
                onPress={() => {}}
              />
              <SettingRow
                item={{ key: "frequency", label: "Üretim sıklığı", icon: Timer }}
                isLast={false}
                onPress={() => {}}
              />
              <SettingRow
                item={{ key: "language", label: "Dil (yakında)", icon: Globe }}
                isLast
                onPress={() => {}}
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
          <SignOut size={18} color="#C86A62" weight="regular" />
          <Text style={styles.logoutText}>Çıkış yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: semantic.appBackground },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 120 },
  screenTitle: { fontSize: 32, lineHeight: 36, fontWeight: "700", color: "#3A2E28", letterSpacing: -0.5, paddingTop: spacing.sm, marginBottom: spacing.md },
  segmentWrap: { marginBottom: spacing.md },
  profileCard: { borderRadius: 28, backgroundColor: "#FDFAF6", padding: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#EDE5D8", alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: "#3A2E28", fontSize: 26, fontWeight: "700" },
  profileInfo: { flex: 1, gap: 6 },
  profileName: { fontSize: 22, lineHeight: 26, color: "#3A2E28", fontWeight: "700" },
  planBadge: { alignSelf: "flex-start", borderRadius: radius.pill, backgroundColor: "#F2EEE8", paddingHorizontal: 12, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 4 },
  planBadgePro: { backgroundColor: "#202126" },
  planBadgeText: { color: "#5C4E46", fontSize: 12, fontWeight: "700" },
  planBadgeTextPro: { color: semantic.textOnDark },
  upgradeCard: { borderRadius: radius.xl, backgroundColor: "#FFFBF0", borderWidth: 1.5, borderColor: "#F0D9B5", padding: spacing.md, marginBottom: spacing.md, gap: 12 },
  upgradeHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  upgradeIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#FEF3D0", alignItems: "center", justifyContent: "center" },
  upgradeHeaderText: { flex: 1, gap: 2 },
  upgradeTitle: { fontSize: 16, fontWeight: "700", color: "#3A2E28", lineHeight: 20 },
  upgradeSubtitle: { fontSize: 12, color: "#8A7A70", fontWeight: "500" },
  upgradeFeatureList: { gap: 7, paddingLeft: 4 },
  upgradeFeatureRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  upgradeFeatureText: { fontSize: 13, color: "#5C4E46", fontWeight: "500" },
  subscriptionInfo: { borderRadius: radius.lg, backgroundColor: "#FDFAF6", paddingHorizontal: spacing.md, paddingVertical: 12, marginBottom: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  subscriptionInfoLeft: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  subscriptionInfoText: { fontSize: 13, color: "#5C4E46", fontWeight: "500", flex: 1 },
  manageLink: { fontSize: 13, color: semantic.accent, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: spacing.lg, flexWrap: "wrap" },
  statCard: { flex: 1, minWidth: "22%", borderRadius: radius.lg, backgroundColor: "#FDFAF6", paddingVertical: 14, alignItems: "center", gap: 4 },
  statValue: { fontSize: 20, fontWeight: "700", color: "#3A2E28" },
  statLabel: { fontSize: 10, color: "#7C6C62", fontWeight: "500" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#8A7A70", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: spacing.xs, marginLeft: 4 },
  settingsCard: { borderRadius: radius.xl, backgroundColor: "#FDFAF6", overflow: "hidden", marginBottom: spacing.lg },
  prefsCard: { borderRadius: radius.xl, backgroundColor: "#FDFAF6", padding: spacing.md, marginBottom: spacing.lg },
  settingsSection: { gap: spacing.xs },
  gallerySection: { marginBottom: spacing.lg },
  galleryStateCard: { borderRadius: radius.lg, backgroundColor: "#FDFAF6", paddingVertical: spacing.lg, paddingHorizontal: spacing.md, alignItems: "center", gap: 10 },
  galleryStateText: { fontSize: 14, color: "#5C4E46", fontWeight: "500", textAlign: "center" },
  retryButton: { borderRadius: radius.md, backgroundColor: "#3A2E28", paddingHorizontal: 14, paddingVertical: 8 },
  retryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  galleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  galleryCard: { width: "48%", borderRadius: radius.lg, backgroundColor: "#FDFAF6", overflow: "hidden" },
  galleryImage: { width: "100%", aspectRatio: 1 },
  galleryMeta: { paddingHorizontal: 10, paddingVertical: 8, gap: 2 },
  galleryType: { fontSize: 12, fontWeight: "700", color: "#3A2E28" },
  galleryDate: { fontSize: 11, color: "#8A7A70" },
  settingRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: 15 },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: "#F2EEE8" },
  settingIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F2EEE8", alignItems: "center", justifyContent: "center", marginRight: spacing.sm },
  settingLabel: { flex: 1, fontSize: 15, color: "#3A2E28", fontWeight: "500" },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.lg, backgroundColor: "#FDF5F3", borderWidth: 1, borderColor: "#E8C5BE", paddingVertical: 16 },
  logoutText: { fontSize: 15, fontWeight: "700", color: "#C86A62" },
});
