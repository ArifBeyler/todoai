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
import { Bell, Clock, Microphone } from "phosphor-react-native";
import { radius, semantic, spacing } from "@/src/ui/tokens";
import { supabase } from "@/src/services/supabase";

type NotificationCategory = {
  key: string;
  label: string;
  enabled: boolean;
};

const DEFAULT_CATEGORIES: NotificationCategory[] = [
  { key: "task_reminder", label: "Görev hatırlatmaları", enabled: true },
  { key: "ai_suggestion", label: "AI önerileri", enabled: true },
  { key: "focus_nudge", label: "Odak hatırlatmaları", enabled: true },
  { key: "visual_ready", label: "Görsel bildirimleri", enabled: true },
  { key: "achievement", label: "Başarı bildirimleri", enabled: true },
  { key: "summary", label: "Günlük özet", enabled: true },
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

type NotificationPreferencesProps = {
  onUpdate?: () => void;
};

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("user_preferences")
        .select("reminder_default_time, active_hours_start, active_hours_end, notification_categories")
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
        const { data: { session } } = await supabase.auth.getSession();
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

  const handleOpenSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.permissionRow}>
        <View style={styles.permissionLeft}>
          <Bell size={20} color="#5C4E46" weight="regular" />
          <View>
            <Text style={styles.permissionTitle}>Bildirimler</Text>
            <Text style={styles.permissionStatus}>
              {permissionStatus === "granted" ? "İzin verildi" : "İzin gerekli"}
            </Text>
          </View>
        </View>
        {permissionStatus !== "granted" && (
          <TouchableOpacity
            onPress={handleOpenSettings}
            style={styles.settingsLink}
            accessibilityRole="button"
          >
            <Text style={styles.settingsLinkText}>Ayarlar</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hatırlatma Zamanı</Text>
        <View style={styles.timeRow}>
          {TIME_PRESETS.slice(0, 4).map((preset) => (
            <TouchableOpacity
              key={preset.value}
              style={[
                styles.timeChip,
                reminderTime === preset.value && styles.timeChipSelected,
              ]}
              onPress={() => {
                setReminderTime(preset.value);
                savePreference("reminder_default_time", preset.value);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: reminderTime === preset.value }}
            >
              <Text
                style={[
                  styles.timeChipText,
                  reminderTime === preset.value && styles.timeChipTextSelected,
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aktif Saatler</Text>
        <View style={styles.activeHoursRow}>
          <View style={styles.activeHourPicker}>
            <Clock size={16} color="#8A7A70" />
            <Text style={styles.activeHourLabel}>Başlangıç</Text>
            <TouchableOpacity
              style={styles.activeHourValue}
              onPress={() => {
                const options = ["07:00", "08:00", "09:00", "10:00", "11:00"];
                const next = options[(options.indexOf(activeStart) + 1) % options.length];
                setActiveStart(next);
                savePreference("active_hours_start", next);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.activeHourValueText}>{activeStart}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.activeHourDash}>—</Text>
          <View style={styles.activeHourPicker}>
            <Clock size={16} color="#8A7A70" />
            <Text style={styles.activeHourLabel}>Bitiş</Text>
            <TouchableOpacity
              style={styles.activeHourValue}
              onPress={() => {
                const options = ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];
                const next = options[(options.indexOf(activeEnd) + 1) % options.length];
                setActiveEnd(next);
                savePreference("active_hours_end", next);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.activeHourValueText}>{activeEnd}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bildirim Kategorileri</Text>
        {categories.map((cat) => (
          <View key={cat.key} style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>{cat.label}</Text>
            <Switch
              value={cat.enabled}
              onValueChange={() => handleCategoryToggle(cat.key)}
              trackColor={{ false: "#E5E3DF", true: semantic.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: "#F8F7F5",
  },
  permissionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3A2E28",
  },
  permissionStatus: {
    fontSize: 12,
    color: "#8A7A70",
    fontWeight: "500",
  },
  settingsLink: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: semantic.accent,
  },
  settingsLinkText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8A7A70",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  timeRow: {
    flexDirection: "row",
    gap: 8,
  },
  timeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: "#F2EEE8",
    alignItems: "center",
  },
  timeChipSelected: {
    backgroundColor: "#111111",
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3A2E28",
  },
  timeChipTextSelected: {
    color: "#FFFFFF",
  },
  activeHoursRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  activeHourPicker: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: "#F2EEE8",
  },
  activeHourLabel: {
    fontSize: 12,
    color: "#8A7A70",
    fontWeight: "500",
    flex: 1,
  },
  activeHourValue: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: "#FFFFFF",
  },
  activeHourValueText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3A2E28",
  },
  activeHourDash: {
    fontSize: 16,
    color: "#8A7A70",
    fontWeight: "600",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#3A2E28",
  },
});
