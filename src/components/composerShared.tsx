import { useCallback, useRef } from "react";
import { Animated, TouchableOpacity } from "react-native";
import {
  Barbell,
  BookOpen,
  Briefcase,
  Heartbeat,
  Target,
} from "phosphor-react-native";

export type CreationMode = "habit" | "task";
export type RepeatType = "daily" | "weekdays" | "weekend" | "customDates";
export type IconName = "barbell" | "briefcase" | "book" | "heartbeat" | "target";
export type PickerMode = "date" | "time";

export type RepeatConfig = {
  type: RepeatType;
  customDates: string[];
};

export const DEFAULT_REPEAT_CONFIG: RepeatConfig = {
  type: "daily",
  customDates: [],
};

// ── Turkish month / day names ────────────────────────────────────────────────

export const MONTH_NAMES_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
] as const;

export const SHORT_MONTH_TR = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
] as const;

export const DAY_HEADERS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

// ── Date helpers ─────────────────────────────────────────────────────────────

export const toDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const parseDateKey = (key: string): { year: number; month: number; day: number } => {
  const [y, m, d] = key.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
};

const formatCustomDatesSummary = (dates: string[]): string => {
  const sorted = [...dates].sort();
  if (sorted.length > 5) return `${sorted.length} özel tarih`;

  const parsed = sorted.map(parseDateKey);
  const allSameMonth = parsed.every(
    (p) => p.month === parsed[0].month && p.year === parsed[0].year,
  );

  if (allSameMonth) {
    const days = parsed.map((p) => p.day).join(", ");
    return `${days} ${MONTH_NAMES_TR[parsed[0].month]}`;
  }

  return parsed.map((p) => `${p.day} ${SHORT_MONTH_TR[p.month]}`).join(", ");
};

export const repeatConfigToLabel = (config: RepeatConfig): string => {
  switch (config.type) {
    case "daily":
      return "Her gün";
    case "weekdays":
      return "Hafta içi";
    case "weekend":
      return "Hafta sonu";
    case "customDates": {
      if (config.customDates.length === 0) return "Tarih seçilmedi";
      return formatCustomDatesSummary(config.customDates);
    }
  }
};

export const repeatConfigToSummary = (config: RepeatConfig): string => {
  switch (config.type) {
    case "daily":
      return "Her gün tekrar eder";
    case "weekdays":
      return "Hafta içi tekrar eder";
    case "weekend":
      return "Hafta sonu tekrar eder";
    case "customDates": {
      if (config.customDates.length === 0) return "";
      const label = formatCustomDatesSummary(config.customDates);
      return `${label} tarihlerinde tekrar eder`;
    }
  }
};

export const repeatConfigToRecurrence = (
  config: RepeatConfig,
): "daily" | "weekdays" | "weekend" | "custom" => {
  if (config.type === "customDates") return "custom";
  return config.type;
};

// ── Visual constants ─────────────────────────────────────────────────────────

export const LAYER = {
  bg: "#F2F2F0",
  card: "#FAFAF9",
  inset: "#EDEDEB",
  border: "rgba(0, 0, 0, 0.04)",
  borderSelected: "rgba(0, 0, 0, 0.08)",
  selectedFill: "#E9EEF5",
} as const;

export const CARD_SHADOW = {
  shadowColor: "rgba(0, 0, 0, 0.06)",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 1,
  shadowRadius: 24,
  elevation: 6,
} as const;

export const SELECTABLE_SHADOW = {
  shadowColor: "rgba(0, 0, 0, 0.08)",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 10,
  elevation: 3,
} as const;

export const ICON_OPTIONS = [
  { icon: "barbell" as IconName, label: "Spor", category: "sports" },
  { icon: "briefcase" as IconName, label: "Kariyer", category: "work" },
  { icon: "book" as IconName, label: "Öğrenme", category: "education" },
  { icon: "heartbeat" as IconName, label: "Sağlık", category: "health" },
  { icon: "target" as IconName, label: "Hedef", category: "other" },
] as const;

export const COLOR_OPTIONS = [
  "#A8B5C8",
  "#7E9AB8",
  "#8DBFA8",
  "#C4A882",
  "#B89DB8",
  "#D4908A",
  "#89AEAD",
  "#C2A4CB",
  "rainbow",
] as const;

export type ColorOption = (typeof COLOR_OPTIONS)[number];

export const getPreviewColor = (value: ColorOption) => {
  if (value === "rainbow") return "#D4D4D8";
  return value;
};

export const renderIcon = (icon: IconName, color: string, size = 20) => {
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

export const BounceTouchable = ({
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
