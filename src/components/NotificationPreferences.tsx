import { useCallback, useEffect, useState } from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Notifications from "expo-notifications";
import {
  Article,
  Bell,
  CaretUpDown,
  CheckSquare,
  type Icon,
  Image,
  Sparkle,
  Timer,
  Trophy,
} from "phosphor-react-native";
import { font, radius, spacing } from "@/src/ui/tokens";
import { supabase } from "@/src/services/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

type NotificationCategory = {
  key: string;
  label: string;
  description: string;
  Icon: Icon;
  enabled: boolean;
};

type NotificationPreferencesProps = {
  onUpdate?: () => void;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES: NotificationCategory[] = [
  {
    key: "task_reminder",
    label: "Görev hatırlatmaları",
    description: "Görevlerin zamanında gelir",
    Icon: CheckSquare,
    enabled: true,
  },
  {
    key: "ai_suggestion",
    label: "AI önerileri",
    description: "Akıllı görev tavsiyeleri",
    Icon: Sparkle,
    enabled: true,
  },
  {
    key: "focus_nudge",
    label: "Odak hatırlatmaları",
    description: "Konsantrasyon desteği",
    Icon: Timer,
    enabled: true,
  },
  {
    key: "visual_ready",
    label: "Görsel bildirimleri",
    description: "Yeni görsel hazır olunca",
    Icon: Image,
    enabled: true,
  },
  {
    key: "achievement",
    label: "Başarı bildirimleri",
    description: "Milestone'larda kutlama",
    Icon: Trophy,
    enabled: true,
  },
  {
    key: "summary",
    label: "Günlük özet",
    description: "Güne genel bakış",
    Icon: Article,
    enabled: true,
  },
];

const TIME_PRESETS = [
  { label: "07:00", value: "07:00" },
  { label: "08:00", value: "08:00" },
  { label: "09:00", value: "09:00" },
  { label: "10:00", value: "10:00" },
  { label: "12:00", value: "12:00" },
  { label: "18:00", value: "18:00" },
  { label: "20:00", value: "20:00" },
  { label: "21:00", value: "21:00" },
];

const START_OPTIONS = ["07:00", "08:00", "09:00", "10:00", "11:00"];
const END_OPTIONS = ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];

// ─── Sub-components ──────────────────────────────────────────────────────────

const SectionBlock = ({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <View style={styles.sectionBlock}>
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {description ? <Text style={styles.sectionDesc}>{description}</Text> : null}
    </View>
    {children}
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const NotificationPreferences = ({ onUpdate }: NotificationPreferencesProps) => {
  const [permissionStatus, setPermissionStatus] = useState<string>("unknown");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [activeStart, setActiveStart] = useState("09:00");
  const [activeEnd, setActiveEnd] = useState("18:00");
  const [categories, setCategories] = useState<NotificationCategory[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    checkPermission();
    loadPreferences();
  }, []);

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const loadPreferences = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("user_preferences")
        .select(
          "reminder_default_time, active_hours_start, active_hours_end, notification_categories",
        )
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (data) {
        if (data.reminder_default_time) setReminderTime(data.reminder_default_time);
        if (data.active_hours_start) setActiveStart(data.active_hours_start);
        if (data.active_hours_end) setActiveEnd(data.active_hours_end);
        if (data.notification_categories) {
          const cats = data.notification_categories as Record<string, boolean>;
          setCategories((prev) =>
            prev.map((c) => ({ ...c, enabled: cats[c.key] ?? c.enabled })),
          );
        }
      }
    } catch {}
  };

  const savePreference = useCallback(
    async (field: string, value: unknown) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;
        await supabase.functions.invoke("update-preferences", {
          body: { [field]: value },
        });
        onUpdate?.();
      } catch {}
    },
    [onUpdate],
  );

  const handleCategoryToggle = useCallback(
    (key: string) => {
      setCategories((prev) => {
        const updated = prev.map((c) =>
          c.key === key ? { ...c, enabled: !c.enabled } : c,
        );
        const map: Record<string, boolean> = {};
        for (const c of updated) map[c.key] = c.enabled;
        savePreference("notification_categories", map);
        return updated;
      });
    },
    [savePreference],
  );

  const handleCycleStart = () => {
    const next = START_OPTIONS[(START_OPTIONS.indexOf(activeStart) + 1) % START_OPTIONS.length];
    setActiveStart(next);
    savePreference("active_hours_start", next);
  };

  const handleCycleEnd = () => {
    const next = END_OPTIONS[(END_OPTIONS.indexOf(activeEnd) + 1) % END_OPTIONS.length];
    setActiveEnd(next);
    savePreference("active_hours_end", next);
  };

  const handleOpenSettings = () => {
    if (Platform.OS === "ios") Linking.openURL("app-settings:");
  };

  const isGranted = permissionStatus === "granted";

  return (
    <View style={styles.container}>
      {/* ── [A] Status Card ─────────────────────────────────────────────── */}
      <View style={styles.statusCard}>
        <View style={styles.statusIconWrap}>
          <Bell size={18} color="#5C4E46" weight="regular" />
        </View>
        <View style={styles.statusMiddle}>
          <Text style={styles.statusTitle}>Bildirimler</Text>
          <Text style={styles.statusSub}>
            {isGranted
              ? "Hatırlatmalar ve günlük özetler etkin"
              : "Bildirim izni kapalı"}
          </Text>
        </View>
        {isGranted ? (
          <View style={styles.statusBadgeGranted}>
            <Text style={styles.statusBadgeGrantedText}>İzin verildi</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.statusBadgeDenied}
            onPress={handleOpenSettings}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Bildirim iznini aç"
          >
            <Text style={styles.statusBadgeDeniedText}>Aç</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── [B] Hatırlatma Saati ─────────────────────────────────────────── */}
      <SectionBlock
        label="HATIRLATMA SAATİ"
        description="Görevlerin bu saatte hatırlatılır"
      >
        <View style={styles.chipGrid}>
          {TIME_PRESETS.map((preset) => {
            const selected = reminderTime === preset.value;
            return (
              <TouchableOpacity
                key={preset.value}
                style={[styles.timeChip, selected && styles.timeChipSelected]}
                onPress={() => {
                  setReminderTime(preset.value);
                  savePreference("reminder_default_time", preset.value);
                }}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Hatırlatma saati ${preset.label}`}
              >
                <Text
                  style={[styles.timeChipText, selected && styles.timeChipTextSelected]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SectionBlock>

      {/* ── [C] Aktif Saatler ────────────────────────────────────────────── */}
      <SectionBlock
        label="AKTİF SAATLER"
        description="Bu aralıkta bildirim alırsın"
      >
        <View style={styles.hoursCard}>
          <TouchableOpacity
            style={styles.hoursBlock}
            onPress={handleCycleStart}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Başlangıç saati: ${activeStart}, değiştirmek için dokunun`}
          >
            <Text style={styles.hoursLabel}>BAŞLANGIÇ</Text>
            <View style={styles.hoursValueRow}>
              <Text style={styles.hoursValue}>{activeStart}</Text>
              <CaretUpDown size={13} color="#B2A498" />
            </View>
          </TouchableOpacity>

          <View style={styles.hoursDivider} />

          <TouchableOpacity
            style={styles.hoursBlock}
            onPress={handleCycleEnd}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Bitiş saati: ${activeEnd}, değiştirmek için dokunun`}
          >
            <Text style={styles.hoursLabel}>BİTİŞ</Text>
            <View style={styles.hoursValueRow}>
              <Text style={styles.hoursValue}>{activeEnd}</Text>
              <CaretUpDown size={13} color="#B2A498" />
            </View>
          </TouchableOpacity>
        </View>
      </SectionBlock>

      {/* ── [D] Bildirim Kategorileri ────────────────────────────────────── */}
      <SectionBlock label="BİLDİRİM KATEGORİLERİ">
        <View style={styles.categoriesCard}>
          {categories.map((cat, idx) => {
            const isLast = idx === categories.length - 1;
            return (
              <View key={cat.key}>
                <View style={styles.categoryRow}>
                  <View style={styles.categoryIconWrap}>
                    <cat.Icon size={15} color="#7A6A60" weight="regular" />
                  </View>
                  <View style={styles.categoryMiddle}>
                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                    <Text style={styles.categoryDesc}>{cat.description}</Text>
                  </View>
                  <Switch
                    value={cat.enabled}
                    onValueChange={() => handleCategoryToggle(cat.key)}
                    trackColor={{ false: "#E8E2DC", true: "#3A2E28" }}
                    thumbColor="#FFFFFF"
                    accessibilityLabel={cat.label}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: cat.enabled }}
                  />
                </View>
                {!isLast && <View style={styles.rowDivider} />}
              </View>
            );
          })}
        </View>
      </SectionBlock>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },

  // ── Status Card ──
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8F6F2",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    padding: spacing.md,
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFEBE4",
    alignItems: "center",
    justifyContent: "center",
  },
  statusMiddle: {
    flex: 1,
    gap: 3,
  },
  statusTitle: {
    fontSize: 15,
    fontFamily: font.semiBold,
    color: "#3A2E28",
  },
  statusSub: {
    fontSize: 12,
    fontFamily: font.regular,
    color: "#9A8E85",
    lineHeight: 16,
  },
  statusBadgeGranted: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "#EDFAF3",
  },
  statusBadgeGrantedText: {
    fontSize: 11,
    fontFamily: font.semiBold,
    color: "#2A7D52",
  },
  statusBadgeDenied: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: "#FFF1EF",
  },
  statusBadgeDeniedText: {
    fontSize: 12,
    fontFamily: font.semiBold,
    color: "#E2513E",
  },

  // ── Section Block ──
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    gap: 2,
    paddingLeft: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: font.semiBold,
    color: "#B2A498",
    letterSpacing: 0.7,
  },
  sectionDesc: {
    fontSize: 12,
    fontFamily: font.regular,
    color: "#9A8E85",
  },

  // ── Time Chips ──
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.md,
    backgroundColor: "#F0ECE6",
  },
  timeChipSelected: {
    backgroundColor: "#1A1410",
  },
  timeChipText: {
    fontSize: 13,
    fontFamily: font.semiBold,
    color: "#5A4A40",
  },
  timeChipTextSelected: {
    color: "#FFFFFF",
  },

  // ── Active Hours ──
  hoursCard: {
    flexDirection: "row",
    backgroundColor: "#F8F6F2",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  hoursBlock: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  hoursLabel: {
    fontSize: 10,
    fontFamily: font.semiBold,
    color: "#9A8E85",
    letterSpacing: 0.6,
  },
  hoursValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  hoursValue: {
    fontSize: 22,
    fontFamily: font.bold,
    color: "#3A2E28",
    letterSpacing: -0.4,
  },
  hoursDivider: {
    width: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 12,
  },

  // ── Category Rows ──
  categoriesCard: {
    backgroundColor: "#F8F6F2",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#EFEBE4",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryMiddle: {
    flex: 1,
    gap: 2,
  },
  categoryLabel: {
    fontSize: 14,
    fontFamily: font.semiBold,
    color: "#3A2E28",
  },
  categoryDesc: {
    fontSize: 11,
    fontFamily: font.regular,
    color: "#A09080",
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginLeft: spacing.md + 32 + 12,
  },
});
