import { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { spacing } from "@/src/ui/tokens";
import {
  BounceTouchable,
  CARD_SHADOW,
  LAYER,
  type RepeatConfig,
  type RepeatType,
} from "./composerShared";
import { MiniCalendar } from "./MiniCalendar";

type RepeatModalProps = {
  visible: boolean;
  current: RepeatConfig;
  onApply: (config: RepeatConfig) => void;
  onCancel: () => void;
};

type OptionDef = {
  key: RepeatType;
  label: string;
  subtitle: string;
};

const OPTIONS: OptionDef[] = [
  { key: "daily", label: "Her Gün", subtitle: "Her gün tekrar eder" },
  { key: "weekdays", label: "Hafta İçi", subtitle: "Pazartesi – Cuma" },
  { key: "weekend", label: "Hafta Sonu", subtitle: "Cumartesi – Pazar" },
  { key: "customDates", label: "Özel Tarihler", subtitle: "Takvimden seç" },
];

export const RepeatModal = ({
  visible,
  current,
  onApply,
  onCancel,
}: RepeatModalProps) => {
  const [draft, setDraft] = useState<RepeatConfig>(current);

  const handleOpen = useCallback(() => {
    setDraft({ ...current, customDates: [...current.customDates] });
  }, [current]);

  const handleSelectType = useCallback((type: RepeatType) => {
    setDraft((prev) => ({
      ...prev,
      type,
      customDates: type === "customDates" ? prev.customDates : [],
    }));
  }, []);

  const handleToggleDate = useCallback((dateKey: string) => {
    setDraft((prev) => {
      const exists = prev.customDates.includes(dateKey);
      return {
        ...prev,
        customDates: exists
          ? prev.customDates.filter((d) => d !== dateKey)
          : [...prev.customDates, dateKey].sort(),
      };
    });
  }, []);

  const handleApply = useCallback(() => {
    onApply(draft);
  }, [draft, onApply]);

  const canApply =
    draft.type !== "customDates" || draft.customDates.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      onShow={handleOpen}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />

        <View style={styles.card}>
          <View style={styles.handle} />

          <Text style={styles.title}>Tekrar</Text>

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            style={styles.scrollBody}
          >
            <View style={styles.optionsWrap}>
              {OPTIONS.map((opt) => {
                const isActive = draft.type === opt.key;
                return (
                  <BounceTouchable
                    key={opt.key}
                    style={[styles.option, isActive && styles.optionActive]}
                    onPress={() => handleSelectType(opt.key)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isActive }}
                  >
                    <View style={[styles.radio, isActive && styles.radioActive]}>
                      {isActive && <View style={styles.radioDot} />}
                    </View>
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.optionSub, isActive && styles.optionSubActive]}>
                        {opt.subtitle}
                      </Text>
                    </View>
                  </BounceTouchable>
                );
              })}
            </View>

            {draft.type === "customDates" && (
              <View style={styles.calendarWrap}>
                <MiniCalendar
                  selectedDates={draft.customDates}
                  onToggleDate={handleToggleDate}
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.footerBtn}
              onPress={onCancel}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Vazgeç"
            >
              <Text style={styles.footerBtnText}>Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerBtnPrimary, !canApply && styles.footerBtnDisabled]}
              onPress={handleApply}
              activeOpacity={0.85}
              disabled={!canApply}
              accessibilityRole="button"
              accessibilityLabel="Uygula"
            >
              <Text style={[styles.footerBtnPrimaryText, !canApply && styles.footerBtnPrimaryTextDisabled]}>
                Uygula
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const RADIO = 20;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.32)",
  },
  card: {
    width: "100%",
    maxHeight: "82%",
    borderRadius: 24,
    backgroundColor: LAYER.card,
    borderWidth: 1,
    borderColor: LAYER.border,
    paddingTop: 10,
    paddingBottom: spacing.md,
    ...CARD_SHADOW,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDDBD7",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111111",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },
  scrollBody: {
    flexShrink: 1,
    paddingHorizontal: spacing.md,
  },

  optionsWrap: {
    gap: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 16,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionActive: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },

  radio: {
    width: RADIO,
    height: RADIO,
    borderRadius: RADIO / 2,
    borderWidth: 2,
    borderColor: "rgba(17,17,17,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: "#FFFFFF",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },

  optionText: {
    flex: 1,
    gap: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.2,
  },
  optionLabelActive: {
    color: "#FFFFFF",
  },
  optionSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(17,17,17,0.4)",
  },
  optionSubActive: {
    color: "rgba(255,255,255,0.6)",
  },

  calendarWrap: {
    marginTop: spacing.md,
    borderRadius: 16,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
    padding: spacing.md,
  },

  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  footerBtn: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
    paddingVertical: 13,
    alignItems: "center",
  },
  footerBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(17,17,17,0.55)",
  },
  footerBtnPrimary: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#111111",
    paddingVertical: 13,
    alignItems: "center",
  },
  footerBtnDisabled: {
    opacity: 0.35,
  },
  footerBtnPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footerBtnPrimaryTextDisabled: {
    opacity: 0.6,
  },
});
