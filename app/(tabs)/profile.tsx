import { router } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  CaretRight,
  CreditCard,
  Gear,
  Globe,
  Palette,
  Question,
  Shield,
  SignOut,
  Scroll,
  Timer,
} from "phosphor-react-native";
import { useSessionStore } from "@state/useSessionStore";
import { useTodoStore } from "@state/useTodoStore";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

type SettingItem = {
  key: string;
  label: string;
  icon: typeof Gear;
  action?: string;
};

const SETTINGS_GENERAL: SettingItem[] = [
  { key: "style", label: "Sanat stilini değiştir", icon: Palette },
  { key: "frequency", label: "Üretim sıklığı", icon: Timer },
  { key: "subscription", label: "Aboneliği yönet", icon: CreditCard, action: "paywall" },
  { key: "notifications", label: "Bildirimler", icon: Bell },
];

const SETTINGS_OTHER: SettingItem[] = [
  { key: "language", label: "Dil", icon: Globe },
  { key: "privacy", label: "Gizlilik politikası", icon: Shield },
  { key: "terms", label: "Kullanım koşulları", icon: Scroll },
  { key: "support", label: "Destek", icon: Question },
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

export default function ProfileScreen() {
  const { profileName, profilePhoto, isPremium, setAuthenticated } = useSessionStore();
  const { todos } = useTodoStore();
  const completed = todos.filter((t) => t.isCompleted).length;
  const completionRate = todos.length ? Math.round((completed / todos.length) * 100) : 0;

  const handleSettingPress = (action?: string) => {
    if (action === "paywall") {
      router.push("/paywall");
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.screenTitle}>Profil</Text>

        {/* Profile card */}
        <View style={[styles.profileCard, shadow.soft]}>
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
              <Text style={styles.planBadgeText}>
                {isPremium ? "Pro" : "Ücretsiz"}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, shadow.card]}>
            <Text style={styles.statValue}>{todos.length}</Text>
            <Text style={styles.statLabel}>Toplam</Text>
          </View>
          <View style={[styles.statCard, shadow.card]}>
            <Text style={styles.statValue}>{completed}</Text>
            <Text style={styles.statLabel}>Tamamlanan</Text>
          </View>
          <View style={[styles.statCard, shadow.card]}>
            <Text style={styles.statValue}>%{completionRate}</Text>
            <Text style={styles.statLabel}>Oran</Text>
          </View>
        </View>

        {/* General settings */}
        <Text style={styles.sectionTitle}>Genel</Text>
        <View style={[styles.settingsCard, shadow.card]}>
          {SETTINGS_GENERAL.map((item, index) => (
            <SettingRow
              key={item.key}
              item={item}
              isLast={index === SETTINGS_GENERAL.length - 1}
              onPress={() => handleSettingPress(item.action)}
            />
          ))}
        </View>

        {/* Other settings */}
        <Text style={styles.sectionTitle}>Diğer</Text>
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

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setAuthenticated(false)}
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
  safeArea: {
    flex: 1,
    backgroundColor: semantic.appBackground,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 120,
  },
  screenTitle: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "700",
    color: "#3A2E28",
    letterSpacing: -0.5,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  profileCard: {
    borderRadius: 28,
    backgroundColor: "#FDFAF6",
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EDE5D8",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#3A2E28",
    fontSize: 26,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  profileName: {
    fontSize: 22,
    lineHeight: 26,
    color: "#3A2E28",
    fontWeight: "700",
  },
  planBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    backgroundColor: "#F2EEE8",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  planBadgePro: {
    backgroundColor: "#202126",
  },
  planBadgeText: {
    color: "#5C4E46",
    fontSize: 12,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: "#FDFAF6",
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#3A2E28",
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    color: "#7C6C62",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8A7A70",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
    marginLeft: 4,
  },
  settingsCard: {
    borderRadius: radius.xl,
    backgroundColor: "#FDFAF6",
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F2EEE8",
  },
  settingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F2EEE8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    color: "#3A2E28",
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.lg,
    backgroundColor: "#FDF5F3",
    borderWidth: 1,
    borderColor: "#E8C5BE",
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#C86A62",
  },
});
