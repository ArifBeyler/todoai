import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Barbell,
  BookOpen,
  Briefcase,
  CaretLeft,
  Clock,
  Heartbeat,
  Target,
} from "phosphor-react-native";
import { useTodoStore } from "@state/useTodoStore";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import { scheduleLocalNotification } from "@/src/services/pushNotifications";
import { radius, shadow, spacing } from "@/src/ui/tokens";
import { resolveTodoIcon } from "@/src/utils/resolveTodoIcon";

type CreationMode = "habit" | "task";
type RepeatOption = "daily" | "weekdays" | "weekly" | "weekend";
type IconName = "barbell" | "briefcase" | "book" | "heartbeat" | "target";
type PickerMode = "date" | "time";

const LAYER = {
  bg: "#F2F2F0",
  card: "#FAFAF9",
  inset: "#EDEDEB",
  border: "rgba(0, 0, 0, 0.04)",
  borderSelected: "rgba(0, 0, 0, 0.08)",
  selectedFill: "#E9EEF5",
} as const;

const CARD_SHADOW = {
  shadowColor: "rgba(0, 0, 0, 0.06)",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 1,
  shadowRadius: 24,
  elevation: 6,
} as const;

const INSET_SHADOW = {
  shadowColor: "rgba(0, 0, 0, 0.04)",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 1,
  shadowRadius: 2,
  elevation: 0,
} as const;

const SELECTABLE_SHADOW = {
  shadowColor: "rgba(0, 0, 0, 0.08)",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 10,
  elevation: 3,
} as const;

const ICON_OPTIONS = [
  { icon: "barbell" as IconName, label: "Spor", category: "sports" },
  { icon: "briefcase" as IconName, label: "Kariyer", category: "work" },
  { icon: "book" as IconName, label: "Öğrenme", category: "education" },
  { icon: "heartbeat" as IconName, label: "Sağlık", category: "health" },
  { icon: "target" as IconName, label: "Hedef", category: "other" },
];

const COLOR_OPTIONS = [
  "#D6D7DC",
  "#CCD1D8",
  "#C8D0D9",
  "#C9D5CF",
  "#D3CFDA",
  "#CFD3DA",
  "#CAD3CF",
  "#D3D4D8",
  "rainbow",
] as const;

const REPEAT_OPTIONS: { key: RepeatOption; label: string }[] = [
  { key: "daily", label: "Her Gün" },
  { key: "weekdays", label: "Hafta içi" },
  { key: "weekly", label: "Haftalık" },
  { key: "weekend", label: "Hafta Sonu" },
];
const INITIAL_VISIBLE_COUNT = 5;
const LOAD_MORE_STEP = 5;

const getPreviewColor = (value: (typeof COLOR_OPTIONS)[number]) => {
  if (value === "rainbow") return "#D4D4D8";
  return value;
};

const renderIcon = (icon: IconName, color: string, size = 20) => {
  switch (icon) {
    case "barbell":
      return <Barbell size={size} color={color} weight="duotone" />;
    case "briefcase":
      return <Briefcase size={size} color={color} weight="duotone" />;
    case "book":
      return <BookOpen size={size} color={color} weight="duotone" />;
    case "heartbeat":
      return <Heartbeat size={size} color={color} weight="duotone" />;
    case "target":
      return <Target size={size} color={color} weight="duotone" />;
    default:
      return null;
  }
};

const BounceTouchable = ({
  onPress,
  style,
  children,
  ...rest
}: React.ComponentProps<typeof TouchableOpacity>) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.92,
      friction: 8,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={style}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function NewTodoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addTodo } = useTodoStore();
  const { requestPermissions } = usePushNotifications();
  const [mode, setMode] = useState<CreationMode>("habit");
  const [title, setTitle] = useState("");
  const [iconIndex, setIconIndex] = useState(0);
  const [color, setColor] = useState<(typeof COLOR_OPTIONS)[number]>(COLOR_OPTIONS[2]);
  const [visibleIconCount, setVisibleIconCount] = useState(
    Math.min(INITIAL_VISIBLE_COUNT, ICON_OPTIONS.length),
  );
  const [visibleColorCount, setVisibleColorCount] = useState(
    Math.min(INITIAL_VISIBLE_COUNT, COLOR_OPTIONS.length),
  );
  const [repeat, setRepeat] = useState<RepeatOption>("daily");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderDate, setReminderDate] = useState(() => {
    const next = new Date();
    next.setHours(8, 0, 0, 0);
    return next;
  });
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [activePickerMode, setActivePickerMode] = useState<PickerMode>("date");
  const titleMotion = useRef(new Animated.Value(1)).current;
  const iconMotion = useRef(new Animated.Value(1)).current;
  const metaMotion = useRef(new Animated.Value(1)).current;
  const colorMotion = useRef(new Animated.Value(1)).current;
  const prevIconKey = useRef<string>("");
  const prevMetaKey = useRef<string>("");
  const prevColorKey = useRef<string>("");

  const canSubmit = useMemo(() => title.trim().length > 0, [title]);
  const selectedIcon = ICON_OPTIONS[iconIndex];
  const selectedRepeatLabel = REPEAT_OPTIONS.find((item) => item.key === repeat)?.label ?? "Her Gün";
  const resolvedIcon = useMemo(
    () => resolveTodoIcon(title.trim(), selectedIcon.category),
    [title, selectedIcon.category],
  );
  const hasKeywordMatch = resolvedIcon.source === "keyword";
  const PreviewIconComponent = resolvedIcon.Icon;
  const currentIconKey = hasKeywordMatch
    ? `kw-${resolvedIcon.category}-${resolvedIcon.color}`
    : `manual-${selectedIcon.icon}`;
  const currentMetaKey = `${mode}-${repeat}`;
  const currentColorKey = `${color}-${hasKeywordMatch ? resolvedIcon.color : "none"}`;
  const previewTitle = title.trim().length > 0 ? title.trim() : mode === "habit" ? "Yeni Alışkanlığın" : "Yeni Görevin";
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
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    [reminderDate],
  );
  const previewMeta = `${mode === "task" ? "Tek Seferlik" : selectedRepeatLabel} • ${
    reminderTimeLabel
  }`;
  const previewTint = getPreviewColor(color);
  const visibleIconIndexes = useMemo(() => {
    return ICON_OPTIONS.slice(0, visibleIconCount).map((_, index) => index);
  }, [visibleIconCount]);
  const visibleColors = useMemo(() => {
    return COLOR_OPTIONS.slice(0, visibleColorCount);
  }, [visibleColorCount]);

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
        setTypingPreviewTitle((previous) => {
          if (previous === previewTitle) return previous;
          if (previewTitle.startsWith(previous)) {
            return previewTitle.slice(0, previous.length + 1);
          }
          if (previous.startsWith(previewTitle)) {
            return previous.slice(0, Math.max(previewTitle.length, previous.length - 1));
          }
          return previewTitle.slice(0, 1);
        });
        setTypingFormTitle((previous) => {
          if (previous === formTitle) return previous;
          if (formTitle.startsWith(previous)) {
            return formTitle.slice(0, previous.length + 1);
          }
          if (previous.startsWith(formTitle)) {
            return previous.slice(0, Math.max(formTitle.length, previous.length - 1));
          }
          return formTitle.slice(0, 1);
        });
        setTypingFormPlaceholder((previous) => {
          if (previous === formPlaceholder) return previous;
          if (formPlaceholder.startsWith(previous)) {
            return formPlaceholder.slice(0, previous.length + 1);
          }
          if (previous.startsWith(formPlaceholder)) {
            return previous.slice(0, Math.max(formPlaceholder.length, previous.length - 1));
          }
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

  const mergeDateAndTime = (current: Date, selected: Date, pickerMode: PickerMode) => {
    const next = new Date(current);
    if (pickerMode === "date") {
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      return next;
    }
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    return next;
  };

  const openPicker = (pickerMode: PickerMode) => {
    setActivePickerMode(pickerMode);
    setIsPickerVisible(true);
  };

  const closePicker = () => {
    setIsPickerVisible(false);
  };

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      closePicker();
      if (event.type === "set" && selected) {
        setReminderDate((prev) => mergeDateAndTime(prev, selected, activePickerMode));
      }
      return;
    }
    if (selected) {
      setReminderDate((prev) => mergeDateAndTime(prev, selected, activePickerMode));
    }
  };

  const handleSave = async () => {
    if (!canSubmit) return;
    const recurrence = mode === "task" ? "once" : repeat === "daily" ? "daily" : repeat === "weekend" ? "weekend" : "weekly";
    const finalCategory = hasKeywordMatch ? resolvedIcon.category : selectedIcon.category;

    addTodo({
      title: title.trim(),
      category: finalCategory,
      priority: "medium",
      recurrence,
    });

    if (reminderEnabled) {
      const hasPermission = await requestPermissions();
      if (hasPermission) {
        await scheduleLocalNotification(
          title.trim(),
          mode === "habit" ? "Alışkanlık zamanın geldi." : "Görev zamanın geldi.",
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
              paddingBottom: 190,
            },
          ]}
        >
          <View style={styles.heroWrap}>
            <View style={[styles.previewShell, shadow.soft]}>
              <View style={styles.previewMainCard}>
                <TouchableOpacity
                  style={styles.previewBadge}
                  onPress={() => router.back()}
                  accessibilityRole="button"
                  accessibilityLabel="Geri dön"
                >
                  <CaretLeft size={16} color="#2E2E31" weight="bold" />
                  <Text style={styles.previewBadgeText}>Geri</Text>
                </TouchableOpacity>
                <Animated.View
                  style={[
                    styles.previewIconWrap,
                    { backgroundColor: hasKeywordMatch ? `${resolvedIcon.color}20` : previewTint },
                    {
                      opacity: Animated.multiply(
                        iconMotion.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.6, 1] }),
                        colorMotion.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.85, 1] }),
                      ),
                      transform: [
                        {
                          scale: Animated.multiply(
                            iconMotion.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                            colorMotion.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
                          ),
                        },
                        {
                          rotate: iconMotion.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: ["-12deg", "4deg", "0deg"],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {hasKeywordMatch ? (
                    <PreviewIconComponent size={26} color={resolvedIcon.color} weight="duotone" />
                  ) : (
                    renderIcon(selectedIcon.icon, "#111111", 26)
                  )}
                </Animated.View>
                <Animated.Text
                  numberOfLines={1}
                  style={[
                    styles.previewTitle,
                    {
                      opacity: titleMotion.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.65, 1],
                      }),
                      transform: [
                        {
                          translateY: titleMotion.interpolate({
                            inputRange: [0, 1],
                            outputRange: [4, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {typingPreviewTitle}
                </Animated.Text>
                <Animated.Text
                  style={[
                    styles.previewMeta,
                    {
                      opacity: metaMotion.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 0.7, 1],
                      }),
                      transform: [
                        {
                          translateY: metaMotion.interpolate({
                            inputRange: [0, 1],
                            outputRange: [6, 0],
                          }),
                        },
                        {
                          scale: metaMotion.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.92, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {previewMeta}
                </Animated.Text>
              </View>
              <View style={styles.previewMetaCard}>
                <Text style={styles.previewHelper}>
                  {reminderEnabled ? "Hatırlatma aktif" : "Hatırlatma kapalı"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sheetWrap}>
            <View style={[styles.mainSheet, shadow.soft]}>
              <View style={styles.dragHandle} />

              <View style={styles.segmentWrap}>
                <TouchableOpacity
                  onPress={() => setMode("task")}
                  style={[styles.segment, mode === "task" && styles.segmentActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: mode === "task" }}
                  activeOpacity={0.92}
                >
                  <Text style={[styles.segmentText, mode === "task" && styles.segmentTextActive]}>
                    Görev
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMode("habit")}
                  style={[styles.segment, mode === "habit" && styles.segmentActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: mode === "habit" }}
                  activeOpacity={0.92}
                >
                  <Text style={[styles.segmentText, mode === "habit" && styles.segmentTextActive]}>
                    Alışkanlık
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.sectionGroup}>
                <Animated.Text
                  style={[
                    styles.sectionLabel,
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
                  placeholderTextColor="rgba(17, 17, 17, 0.42)"
                  style={styles.nameInput}
                />
              </View>

              <View style={styles.sectionGroup}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>İkon</Text>
                  {visibleIconCount < ICON_OPTIONS.length ? (
                    <TouchableOpacity
                      onPress={() =>
                        setVisibleIconCount((prev) =>
                          Math.min(prev + LOAD_MORE_STEP, ICON_OPTIONS.length),
                        )
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Tüm ikonları gör"
                    >
                      <Text style={styles.viewAll}>Tümünü Gör</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.sideSpacer} />
                  )}
                </View>
                <View style={styles.iconRow}>
                  {visibleIconIndexes.map((index) => {
                    const item = ICON_OPTIONS[index];
                    const selected = index === iconIndex;
                    return (
                      <BounceTouchable
                        key={`${item.label}-${item.icon}`}
                        style={[styles.iconChip, selected && styles.iconChipActive]}
                        onPress={() => setIconIndex(index)}
                        accessibilityRole="button"
                        accessibilityLabel={`${item.label} ikonu`}
                        accessibilityState={{ selected }}
                      >
                        {renderIcon(item.icon, selected ? "#111111" : "rgba(17, 17, 17, 0.62)", 18)}
                      </BounceTouchable>
                    );
                  })}
                </View>
                <View style={[styles.sectionHeaderRow, styles.colorHeaderRow]}>
                  <Text style={styles.inlineLabel}>Renk</Text>
                  {visibleColorCount < COLOR_OPTIONS.length ? (
                    <TouchableOpacity
                      onPress={() =>
                        setVisibleColorCount((prev) =>
                          Math.min(prev + LOAD_MORE_STEP, COLOR_OPTIONS.length),
                        )
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Tüm renkleri gör"
                    >
                      <Text style={styles.viewAll}>Tümünü Gör</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.sideSpacer} />
                  )}
                </View>
                <View style={styles.colorRow}>
                  {visibleColors.map((item) => {
                    const selected = color === item;
                    return (
                      <BounceTouchable
                        key={item}
                        style={[styles.colorChipWrap, selected && styles.colorChipWrapActive]}
                        onPress={() => setColor(item)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={item === "rainbow" ? "Özel renk" : `Renk ${item}`}
                      >
                        {item === "rainbow" ? (
                          <LinearGradient
                            colors={["#ff7a7a", "#ffd48c", "#8ecfb0", "#88b6f0", "#d4a9e5"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.colorChip}
                          />
                        ) : (
                          <View style={[styles.colorChip, { backgroundColor: item }]} />
                        )}
                      </BounceTouchable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.sectionGroup}>
                <Text style={styles.sectionLabel}>Tekrar</Text>
                <View style={[styles.repeatSelectorWrap, mode === "task" && styles.repeatRowDisabled]}>
                  {REPEAT_OPTIONS.map((item) => {
                    const selected = repeat === item.key;
                    return (
                      <BounceTouchable
                        key={item.key}
                        style={[styles.repeatOptionTile, selected && styles.repeatOptionTileActive]}
                        onPress={() => setRepeat(item.key)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        disabled={mode === "task"}
                      >
                        <Text style={[styles.repeatOptionText, selected && styles.repeatOptionTextActive]}>
                          {item.label}
                        </Text>
                      </BounceTouchable>
                    );
                  })}
                </View>
                <View style={styles.sectionDivider} />
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>Tarih ve Saat</Text>
                  <Clock size={15} color="rgba(17, 17, 17, 0.62)" weight="regular" />
                </View>
                <View style={styles.dateTimeActionsRow}>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => openPicker("date")}
                    accessibilityRole="button"
                    accessibilityLabel="Tarih seç"
                  >
                    <Text style={styles.dateTimeLabel}>Tarih</Text>
                    <Text style={styles.dateTimeValue}>{reminderDateLabel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => openPicker("time")}
                    accessibilityRole="button"
                    accessibilityLabel="Saat seç"
                  >
                    <Text style={styles.dateTimeLabel}>Saat</Text>
                    <Text style={styles.dateTimeValue}>{reminderTimeLabel}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.sectionDivider} />
                <View style={styles.reminderRow}>
                  <View>
                    <Text style={styles.sectionLabel}>Hatırlatma</Text>
                    <Text style={styles.helperText}>
                      {reminderEnabled
                        ? "Seçilen saate göre bildirim gönderilir."
                        : "Hatırlatma şu an kapalı."}
                    </Text>
                  </View>
                  <Switch
                    value={reminderEnabled}
                    onValueChange={setReminderEnabled}
                    trackColor={{ false: "#D8D8DD", true: "#111111" }}
                    thumbColor="#FFFFFF"
                    accessibilityLabel="Hatırlatma anahtarı"
                  />
                </View>
                {mode === "task" ? (
                  <Text style={styles.helperText}>
                    Tek seferlik görevlerde tekrar otomatik olarak kapalıdır.
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom + spacing.xs, 18) }]}>
          <BounceTouchable
            style={[styles.saveButton, !canSubmit && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Kaydet"
          >
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </BounceTouchable>
        </View>

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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: LAYER.bg,
  },
  scrollContent: {
    paddingHorizontal: 14,
  },
  heroWrap: {
    zIndex: 1,
  },

  /* ── Preview shell ── */
  previewShell: {
    borderRadius: 32,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
    padding: spacing.xs,
    ...CARD_SHADOW,
  },
  previewMainCard: {
    borderRadius: 26,
    backgroundColor: LAYER.card,
    borderWidth: 1,
    borderColor: LAYER.border,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
  },
  previewMetaCard: {
    marginTop: spacing.xs,
    borderRadius: 20,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  previewBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: LAYER.inset,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  previewBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: 0.2,
  },
  previewIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    borderWidth: 1,
    borderColor: LAYER.border,
  },
  previewTitle: {
    marginTop: spacing.xs,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.45,
  },
  previewMeta: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(17, 17, 17, 0.5)",
  },
  previewHelper: {
    fontSize: 12,
    color: "rgba(17, 17, 17, 0.45)",
  },

  /* ── Bottom sheet ── */
  sheetWrap: {
    marginTop: spacing.md,
    zIndex: 1,
  },
  mainSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: LAYER.card,
    borderWidth: 1,
    borderColor: LAYER.border,
    paddingTop: 12,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    ...CARD_SHADOW,
  },
  dragHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDDBD7",
    marginBottom: 10,
  },
  sideSpacer: {
    width: 36,
  },
  screenTitle: {
    fontSize: 29,
    lineHeight: 33,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.5,
    textAlign: "center",
    maxWidth: "74%",
  },

  /* ── Segment control ── */
  segmentWrap: {
    flexDirection: "row",
    borderRadius: 16,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
    padding: 3,
    marginBottom: spacing.sm,
  },
  segment: {
    flex: 1,
    borderRadius: 13,
    paddingVertical: 9,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: "#111111",
    ...CARD_SHADOW,
    shadowRadius: 8,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(17, 17, 17, 0.5)",
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },

  /* ── Section cards ── */
  sectionGroup: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: LAYER.border,
    backgroundColor: LAYER.card,
    padding: spacing.md,
    marginTop: spacing.md,
    ...CARD_SHADOW,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.1,
  },
  inlineLabel: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(17, 17, 17, 0.5)",
  },

  /* ── Input ── */
  nameInput: {
    borderRadius: radius.sm,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111111",
    marginTop: spacing.xs,
    ...SELECTABLE_SHADOW,
  },
  viewAll: {
    fontSize: 13,
    color: "rgba(17, 17, 17, 0.5)",
    fontWeight: "600",
  },
  colorHeaderRow: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },

  /* ── Icon chips ── */
  iconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  iconChip: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
    alignItems: "center",
    justifyContent: "center",
    ...SELECTABLE_SHADOW,
  },
  iconChipActive: {
    backgroundColor: LAYER.selectedFill,
    borderColor: LAYER.borderSelected,
  },

  /* ── Color chips ── */
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    marginTop: 2,
  },
  colorChipWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: LAYER.inset,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: LAYER.border,
    ...SELECTABLE_SHADOW,
  },
  colorChipWrapActive: {
    backgroundColor: LAYER.selectedFill,
    borderColor: LAYER.borderSelected,
  },
  colorChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },

  /* ── Repeat ── */
  repeatSelectorWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 6,
    borderRadius: radius.sm,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
  },
  repeatOptionTile: {
    minWidth: "47%",
    flexGrow: 1,
    borderRadius: radius.pill,
    backgroundColor: LAYER.card,
    borderWidth: 1,
    borderColor: LAYER.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    ...CARD_SHADOW,
    shadowRadius: 10,
  },
  repeatOptionTileActive: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },
  repeatOptionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(17, 17, 17, 0.5)",
  },
  repeatOptionTextActive: {
    color: "#FFFFFF",
  },
  repeatRowDisabled: {
    opacity: 0.5,
  },

  /* ── Date / Time ── */
  dateTimeActionsRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  dateTimeButton: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: LAYER.border,
    backgroundColor: LAYER.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    ...CARD_SHADOW,
    shadowRadius: 10,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: "rgba(17, 17, 17, 0.5)",
    fontWeight: "600",
  },
  dateTimeValue: {
    marginTop: 2,
    fontSize: 14,
    color: "#111111",
    fontWeight: "700",
  },

  /* ── Reminder & helpers ── */
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: "rgba(17, 17, 17, 0.5)",
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    marginVertical: spacing.sm,
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  /* ── Bottom bar ── */
  bottomArea: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 0,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: LAYER.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: LAYER.border,
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 12,
  },
  saveButton: {
    borderRadius: radius.pill,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  saveButtonDisabled: {
    backgroundColor: "rgba(17, 17, 17, 0.15)",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
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
});
