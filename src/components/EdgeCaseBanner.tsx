import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  ArrowCounterClockwise,
  Camera,
  Crown,
  Info,
  WarningCircle,
} from "phosphor-react-native";
import type { EdgeCaseType } from "@/src/hooks/useEdgeCases";
import { radius, semantic, spacing } from "@/src/ui/tokens";

type EdgeCaseBannerProps = {
  edgeCase: EdgeCaseType;
  title: string;
  subtitle: string;
  onAction?: () => void;
};

const EDGE_CASE_STYLE: Record<
  string,
  {
    bg: string;
    border: string;
    iconBg: string;
    icon: typeof Info;
    iconColor: string;
    actionLabel: string | null;
  }
> = {
  paywall_dismissed: {
    bg: "#F5F2EE",
    border: "rgba(0,0,0,0.05)",
    iconBg: "#EDE8E2",
    icon: Crown,
    iconColor: "#111",
    actionLabel: "Keşfet",
  },
  subscribed_no_photo: {
    bg: "#EEF4F4",
    border: "rgba(0,0,0,0.05)",
    iconBg: "#E0EDED",
    icon: Camera,
    iconColor: "#111",
    actionLabel: "Yükle",
  },
  photo_skipped: {
    bg: "#EEF4F4",
    border: "rgba(0,0,0,0.05)",
    iconBg: "#E0EDED",
    icon: Camera,
    iconColor: "#111",
    actionLabel: "Yükle",
  },
  photo_failed: {
    bg: "#FEF2F2",
    border: "rgba(226,81,62,0.12)",
    iconBg: "#FEEDED",
    icon: WarningCircle,
    iconColor: "#E2513E",
    actionLabel: "Tekrar Dene",
  },
  generation_failed: {
    bg: "#FEF2F2",
    border: "rgba(226,81,62,0.12)",
    iconBg: "#FEEDED",
    icon: ArrowCounterClockwise,
    iconColor: "#E2513E",
    actionLabel: "Tekrar Dene",
  },
  tasks_deleted_below_threshold: {
    bg: "#FFF8EE",
    border: "rgba(0,0,0,0.05)",
    iconBg: "#FFEFD6",
    icon: Info,
    iconColor: "#D4860A",
    actionLabel: null,
  },
  trial_expired: {
    bg: "#FFF8EE",
    border: "rgba(0,0,0,0.05)",
    iconBg: "#FFEFD6",
    icon: Crown,
    iconColor: "#D4860A",
    actionLabel: "Abone Ol",
  },
  processing_interrupted: {
    bg: "#EEF4F4",
    border: "rgba(0,0,0,0.05)",
    iconBg: "#E0EDED",
    icon: Info,
    iconColor: "#111",
    actionLabel: null,
  },
};

const DEFAULT_STYLE = {
  bg: "#F5F2EE",
  border: "rgba(0,0,0,0.05)",
  iconBg: "#EDE8E2",
  icon: Info,
  iconColor: "#111",
  actionLabel: null,
};

export const EdgeCaseBanner = ({
  edgeCase,
  title,
  subtitle,
  onAction,
}: EdgeCaseBannerProps) => {
  if (edgeCase === "none" || edgeCase === "insufficient_tasks") return null;

  const config = EDGE_CASE_STYLE[edgeCase] ?? DEFAULT_STYLE;
  const IconComponent = config.icon;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bg, borderColor: config.border },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: config.iconBg }]}>
        <IconComponent size={18} color={config.iconColor} weight="fill" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {config.actionLabel && onAction ? (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={config.actionLabel}
        >
          <Text style={styles.actionText}>{config.actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: semantic.textPrimary,
  },
  subtitle: {
    marginTop: 1,
    fontSize: 12,
    color: semantic.textSecondary,
    lineHeight: 16,
  },
  actionButton: {
    borderRadius: radius.sm,
    backgroundColor: semantic.heroStart,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionText: {
    color: semantic.textOnDark,
    fontSize: 12,
    fontWeight: "700",
  },
});
