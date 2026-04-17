import { useRouter } from "expo-router";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTodoStore } from "@state/useTodoStore";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import { scheduleLocalNotification } from "@/src/services/pushNotifications";
import { radius, shadow, spacing } from "@/src/ui/tokens";
import { resolveTodoIcon } from "@/src/utils/resolveTodoIcon";

import {
  CARD_SHADOW,
  COLOR_OPTIONS,
  DEFAULT_REPEAT_CONFIG,
  ICON_OPTIONS,
  LAYER,
  type ColorOption,
  type CreationMode,
  type PickerMode,
  type RepeatConfig,
  repeatConfigToRecurrence,
} from "@/src/components/composerShared";

import { LiveTaskPreview } from "@/src/components/LiveTaskPreview";
import { ComposerSection } from "@/src/components/ComposerSection";
import { IconPickerRow } from "@/src/components/IconPickerRow";
import { ColorPickerRow } from "@/src/components/ColorPickerRow";
import { RepeatSelector } from "@/src/components/RepeatSelector";
import { ScheduleRow } from "@/src/components/ScheduleRow";
import { ReminderBlock } from "@/src/components/ReminderBlock";
import { StickySaveBar } from "@/src/components/StickySaveBar";

const INITIAL_VISIBLE_COUNT = 5;
const LOAD_MORE_STEP = 5;

export default function NewTodoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addTodo } = useTodoStore();
  const { requestPermissions } = usePushNotifications();

  // ── Form state ───────────────────────────────────────────────────────────
  const [mode, setMode] = useState<CreationMode>("task");
  const [title, setTitle] = useState("");
  const [iconIndex, setIconIndex] = useState(0);
  const [color, setColor] = useState<ColorOption>(COLOR_OPTIONS[2]);
  const [visibleIconCount, setVisibleIconCount] = useState(
    Math.min(INITIAL_VISIBLE_COUNT, ICON_OPTIONS.length),
  );
  const [visibleColorCount, setVisibleColorCount] = useState(
    Math.min(INITIAL_VISIBLE_COUNT, COLOR_OPTIONS.length),
  );
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [repeatConfig, setRepeatConfig] = useState<RepeatConfig>({
    ...DEFAULT_REPEAT_CONFIG,
  });
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderDate, setReminderDate] = useState(() => {
    const next = new Date();
    next.setHours(8, 0, 0, 0);
    return next;
  });
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [activePickerMode, setActivePickerMode] = useState<PickerMode>("date");

  // ── Animation values ─────────────────────────────────────────────────────
  const titleMotion = useRef(new Animated.Value(1)).current;
  const iconMotion = useRef(new Animated.Value(1)).current;
  const metaMotion = useRef(new Animated.Value(1)).current;
  const colorMotion = useRef(new Animated.Value(1)).current;
  const prevIconKey = useRef<string>("");
  const prevMetaKey = useRef<string>("");
  const prevColorKey = useRef<string>("");

  // ── Derived values ───────────────────────────────────────────────────────
  const canSubmit = useMemo(() => title.trim().length > 0, [title]);
  const selectedIcon = ICON_OPTIONS[iconIndex];

  const resolvedIcon = useMemo(
    () => resolveTodoIcon(title.trim(), selectedIcon.category),
    [title, selectedIcon.category],
  );
  const hasKeywordMatch = resolvedIcon.source === "keyword";

  const currentIconKey = hasKeywordMatch
    ? `kw-${resolvedIcon.category}-${resolvedIcon.color}`
    : `manual-${selectedIcon.icon}`;
  const currentMetaKey = `${mode}-${repeatConfig.type}-${repeatConfig.customDates.join(",")}`;
  const currentColorKey = `${color}-${hasKeywordMatch ? resolvedIcon.color : "none"}`;

  const previewTitle =
    title.trim().length > 0
      ? title.trim()
      : mode === "habit"
        ? "Yeni Alışkanlığın"
        : "Yeni Görevin";

  const formTitle = mode === "habit" ? "Alışkanlık Adı" : "Görev Adı";
  const formPlaceholder = mode === "habit" ? "Alışkanlık adı" : "Görev adı";

  const [typingPreviewTitle, setTypingPreviewTitle] = useState(previewTitle);
  const [typingFormTitle, setTypingFormTitle] = useState(formTitle);
  const [typingFormPlaceholder, setTypingFormPlaceholder] = useState(formPlaceholder);

  const reminderTimeLabel = useMemo(
    () =>
      reminderDate.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [reminderDate],
  );
  const reminderDateLabel = useMemo(
    () =>
      reminderDate.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [reminderDate],
  );

  // ── Animations ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (prevIconKey.current && prevIconKey.current !== currentIconKey) {
      iconMotion.setValue(0);
      Animated.spring(iconMotion, {
        toValue: 1,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }).start();
    }
    prevIconKey.current = currentIconKey;
  }, [currentIconKey, iconMotion]);

  useEffect(() => {
    if (prevMetaKey.current && prevMetaKey.current !== currentMetaKey) {
      metaMotion.setValue(0);
      Animated.spring(metaMotion, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
    prevMetaKey.current = currentMetaKey;
  }, [currentMetaKey, metaMotion]);

  useEffect(() => {
    if (prevColorKey.current && prevColorKey.current !== currentColorKey) {
      colorMotion.setValue(0);
      Animated.spring(colorMotion, {
        toValue: 1,
        friction: 7,
        tension: 110,
        useNativeDriver: true,
      }).start();
    }
    prevColorKey.current = currentColorKey;
  }, [currentColorKey, colorMotion]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let isMounted = true;

    titleMotion.setValue(0);
    Animated.timing(titleMotion, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();

    const animateTyping = () => {
      timeoutId = setTimeout(() => {
        if (!isMounted) return;
        setTypingPreviewTitle((prev) => {
          if (prev === previewTitle) return prev;
          if (previewTitle.startsWith(prev))
            return previewTitle.slice(0, prev.length + 1);
          if (prev.startsWith(previewTitle))
            return prev.slice(0, Math.max(previewTitle.length, prev.length - 1));
          return previewTitle.slice(0, 1);
        });
        setTypingFormTitle((prev) => {
          if (prev === formTitle) return prev;
          if (formTitle.startsWith(prev))
            return formTitle.slice(0, prev.length + 1);
          if (prev.startsWith(formTitle))
            return prev.slice(0, Math.max(formTitle.length, prev.length - 1));
          return formTitle.slice(0, 1);
        });
        setTypingFormPlaceholder((prev) => {
          if (prev === formPlaceholder) return prev;
          if (formPlaceholder.startsWith(prev))
            return formPlaceholder.slice(0, prev.length + 1);
          if (prev.startsWith(formPlaceholder))
            return prev.slice(
              0,
              Math.max(formPlaceholder.length, prev.length - 1),
            );
          return formPlaceholder.slice(0, 1);
        });
        animateTyping();
      }, 20);
    };

    animateTyping();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [formPlaceholder, formTitle, previewTitle, titleMotion]);

  // ── Picker helpers ───────────────────────────────────────────────────────
  const mergeDateAndTime = (
    current: Date,
    selected: Date,
    pickerMode: PickerMode,
  ) => {
    const next = new Date(current);
    if (pickerMode === "date") {
      next.setFullYear(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate(),
      );
      return next;
    }
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    return next;
  };

  const openPicker = (pickerMode: PickerMode) => {
    setActivePickerMode(pickerMode);
    setIsPickerVisible(true);
  };

  const closePicker = () => setIsPickerVisible(false);

  const handlePickerChange = (
    event: DateTimePickerEvent,
    selected?: Date,
  ) => {
    if (Platform.OS === "android") {
      closePicker();
      if (event.type === "set" && selected) {
        setReminderDate((prev) =>
          mergeDateAndTime(prev, selected, activePickerMode),
        );
      }
      return;
    }
    if (selected) {
      setReminderDate((prev) =>
        mergeDateAndTime(prev, selected, activePickerMode),
      );
    }
  };

  // ── Mode change handler ──────────────────────────────────────────────────
  const handleModeChange = useCallback((newMode: CreationMode) => {
    setMode(newMode);
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!canSubmit) return;

    const recurrence =
      mode === "task" ? "once" : repeatConfigToRecurrence(repeatConfig);

    const finalCategory = hasKeywordMatch
      ? resolvedIcon.category
      : selectedIcon.category;

    addTodo({
      title: title.trim(),
      category: finalCategory,
      priority,
      recurrence,
      customDates:
        mode === "habit" && repeatConfig.type === "customDates"
          ? repeatConfig.customDates
          : undefined,
    });

    if (reminderEnabled) {
      const hasPermission = await requestPermissions();
      if (hasPermission) {
        await scheduleLocalNotification(
          title.trim(),
          mode === "habit"
            ? "Alışkanlık zamanın geldi."
            : "Görev zamanın geldi.",
          reminderDate,
        );
      }
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/home");
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top + spacing.xs, spacing.md),
              paddingBottom: 140,
            },
          ]}
        >
          {/* ── Live Preview ──────────────────────────────────────────── */}
          <LiveTaskPreview
            title={typingPreviewTitle}
            mode={mode}
            repeatConfig={repeatConfig}
            timeLabel={reminderTimeLabel}
            reminderEnabled={reminderEnabled}
            selectedColor={color}
            selectedIconName={selectedIcon.icon}
            hasKeywordMatch={hasKeywordMatch}
            resolvedIconColor={resolvedIcon.color}
            ResolvedIcon={resolvedIcon.Icon}
            iconMotion={iconMotion}
            colorMotion={colorMotion}
            titleMotion={titleMotion}
            metaMotion={metaMotion}
            onBack={() => router.back()}
          />

          {/* ── Composer Sheet ────────────────────────────────────────── */}
          <View style={[styles.sheet, shadow.soft]}>
            <View style={styles.dragHandle} />

            {/* A. Basics */}
            <View style={styles.segmentWrap}>
              <TouchableOpacity
                onPress={() => handleModeChange("task")}
                style={[styles.segment, mode === "task" && styles.segmentActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === "task" }}
                activeOpacity={0.92}
              >
                <Text
                  style={[
                    styles.segmentText,
                    mode === "task" && styles.segmentTextActive,
                  ]}
                >
                  Görev
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleModeChange("habit")}
                style={[
                  styles.segment,
                  mode === "habit" && styles.segmentActive,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === "habit" }}
                activeOpacity={0.92}
              >
                <Text
                  style={[
                    styles.segmentText,
                    mode === "habit" && styles.segmentTextActive,
                  ]}
                >
                  Alışkanlık
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Animated.Text
                style={[
                  styles.inputLabel,
                  {
                    opacity: titleMotion.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.65, 1],
                    }),
                  },
                ]}
              >
                {typingFormTitle}
              </Animated.Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={typingFormPlaceholder}
                placeholderTextColor="rgba(17, 17, 17, 0.36)"
                style={styles.nameInput}
                returnKeyType="done"
              />
            </View>

            {/* B. Appearance */}
            <ComposerSection title="Görünüm" showDivider>
              <IconPickerRow
                selectedIndex={iconIndex}
                onSelect={setIconIndex}
                visibleCount={visibleIconCount}
                onShowAll={() =>
                  setVisibleIconCount((prev) =>
                    Math.min(prev + LOAD_MORE_STEP, ICON_OPTIONS.length),
                  )
                }
              />
              <ColorPickerRow
                selectedColor={color}
                onSelect={setColor}
                visibleCount={visibleColorCount}
                onShowAll={() =>
                  setVisibleColorCount((prev) =>
                    Math.min(prev + LOAD_MORE_STEP, COLOR_OPTIONS.length),
                  )
                }
              />
            </ComposerSection>

            {/* C. Priority */}
            <ComposerSection title="Öncelik" showDivider>
              <View style={styles.priorityRow}>
                {(["low", "medium", "high"] as const).map((level) => {
                  const labels = { low: "Düşük", medium: "Orta", high: "Yüksek" };
                  const colors = { low: "#4CAF50", medium: "#FF9800", high: "#F44336" };
                  const isSelected = priority === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      onPress={() => setPriority(level)}
                      style={[
                        styles.priorityBtn,
                        isSelected && {
                          borderColor: colors[level],
                          backgroundColor: `${colors[level]}18`,
                        },
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${labels[level]} öncelik`}
                      activeOpacity={0.75}
                    >
                      <View
                        style={[
                          styles.priorityDot,
                          { backgroundColor: isSelected ? colors[level] : "#D0C8C0" },
                        ]}
                      />
                      <Text
                        style={[
                          styles.priorityLabel,
                          isSelected && { color: colors[level], fontWeight: "700" },
                        ]}
                      >
                        {labels[level]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ComposerSection>

            {/* D. Schedule */}
            <ComposerSection title="Zamanlama" showDivider>
              {mode === "habit" && (
                <RepeatSelector
                  config={repeatConfig}
                  onChange={setRepeatConfig}
                />
              )}
              <ScheduleRow
                dateLabel={reminderDateLabel}
                timeLabel={reminderTimeLabel}
                onPressDate={() => openPicker("date")}
                onPressTime={() => openPicker("time")}
              />
              <ReminderBlock
                enabled={reminderEnabled}
                onToggle={setReminderEnabled}
                mode={mode}
                repeatConfig={repeatConfig}
                timeLabel={reminderTimeLabel}
              />
            </ComposerSection>
          </View>
        </ScrollView>

        {/* ── Sticky Save Bar ─────────────────────────────────────────── */}
        <StickySaveBar enabled={canSubmit} onSave={handleSave} />

        {/* ── Date / Time Picker ──────────────────────────────────────── */}
        {Platform.OS === "android" && isPickerVisible ? (
          <DateTimePicker
            value={reminderDate}
            mode={activePickerMode}
            display="default"
            is24Hour
            onChange={handlePickerChange}
          />
        ) : null}

        <Modal
          visible={Platform.OS === "ios" && isPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={closePicker}
        >
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={closePicker} />
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalHeaderAction}
                  onPress={closePicker}
                  accessibilityRole="button"
                  accessibilityLabel="İptal"
                >
                  <Text style={styles.modalActionText}>İptal</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {activePickerMode === "date" ? "Tarih Seç" : "Saat Seç"}
                </Text>
                <TouchableOpacity
                  style={[styles.modalHeaderAction, styles.modalHeaderActionEnd]}
                  onPress={closePicker}
                  accessibilityRole="button"
                  accessibilityLabel="Tamam"
                >
                  <Text style={styles.modalActionText}>Tamam</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={reminderDate}
                mode={activePickerMode}
                display="spinner"
                onChange={handlePickerChange}
                is24Hour
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: LAYER.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  /* ── Composer sheet ── */
  sheet: {
    marginTop: spacing.md,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: LAYER.card,
    borderWidth: 1,
    borderColor: LAYER.border,
    paddingTop: 10,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    ...CARD_SHADOW,
  },
  dragHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDDBD7",
    marginBottom: spacing.sm,
  },

  /* ── Segment control ── */
  segmentWrap: {
    flexDirection: "row",
    borderRadius: 15,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
    padding: 3,
  },
  segment: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: "#111111",
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(17, 17, 17, 0.48)",
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },

  /* ── Input ── */
  inputGroup: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.1,
    paddingLeft: 2,
  },
  nameInput: {
    borderRadius: radius.sm,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 16,
    color: "#111111",
    fontWeight: "500",
  },

  /* ── Modal ── */
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: LAYER.card,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: Math.max(spacing.lg, spacing.md),
    borderWidth: 1,
    borderColor: LAYER.border,
    width: "100%",
    alignSelf: "center",
    ...CARD_SHADOW,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  modalHeaderAction: {
    width: 72,
    justifyContent: "center",
  },
  modalHeaderActionEnd: {
    alignItems: "flex-end",
  },
  modalActionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },
  iosPicker: {
    marginTop: -2,
    width: "100%",
    alignSelf: "center",
  },

  /* ── Priority picker ── */
  priorityRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  priorityBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E0DA",
    backgroundColor: "#FAFAF8",
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8A7E78",
  },
});
