import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CaretLeft } from "phosphor-react-native";
import { radius, spacing } from "@/src/ui/tokens";
import {
  CARD_SHADOW,
  LAYER,
  type ColorOption,
  type CreationMode,
  type IconName,
  type RepeatConfig,
  getPreviewColor,
  renderIcon,
  repeatConfigToLabel,
} from "./composerShared";
import type { Icon } from "phosphor-react-native";

type LiveTaskPreviewProps = {
  title: string;
  mode: CreationMode;
  repeatConfig: RepeatConfig;
  timeLabel: string;
  reminderEnabled: boolean;
  selectedColor: ColorOption;
  selectedIconName: IconName;
  hasKeywordMatch: boolean;
  resolvedIconColor: string;
  ResolvedIcon: Icon;
  iconMotion: Animated.Value;
  colorMotion: Animated.Value;
  titleMotion: Animated.Value;
  metaMotion: Animated.Value;
  onBack: () => void;
};

export const LiveTaskPreview = ({
  title,
  mode,
  repeatConfig,
  timeLabel,
  reminderEnabled,
  selectedColor,
  selectedIconName,
  hasKeywordMatch,
  resolvedIconColor,
  ResolvedIcon,
  iconMotion,
  colorMotion,
  titleMotion,
  metaMotion,
  onBack,
}: LiveTaskPreviewProps) => {
  const previewTint = getPreviewColor(selectedColor);
  const repeatLabel =
    mode === "task" ? "Tek Seferlik" : repeatConfigToLabel(repeatConfig);
  const metaSummary = `${repeatLabel} • ${timeLabel}${reminderEnabled ? " • Hatırlatma açık" : ""}`;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
        >
          <CaretLeft size={18} color="#111111" weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === "habit" ? "Yeni Alışkanlık" : "Yeni Görev"}
        </Text>
        <View style={styles.backButton} accessible={false} />
      </View>

      <View style={styles.card}>
        <Animated.View
          style={[
            styles.iconWrap,
            {
              backgroundColor: hasKeywordMatch
                ? `${resolvedIconColor}18`
                : `${previewTint}40`,
            },
            {
              opacity: Animated.multiply(
                iconMotion.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0, 0.6, 1],
                }),
                colorMotion.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0.5, 0.85, 1],
                }),
              ),
              transform: [
                {
                  scale: Animated.multiply(
                    iconMotion.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                    colorMotion.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
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
            <ResolvedIcon size={22} color={resolvedIconColor} weight="duotone" />
          ) : (
            renderIcon(selectedIconName, "#111111", 22)
          )}
        </Animated.View>

        <View style={styles.textWrap}>
          <Animated.Text
            numberOfLines={1}
            style={[
              styles.title,
              {
                opacity: titleMotion.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.65, 1],
                }),
                transform: [
                  {
                    translateY: titleMotion.interpolate({
                      inputRange: [0, 1],
                      outputRange: [3, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {title}
          </Animated.Text>

          <Animated.Text
            numberOfLines={1}
            style={[
              styles.meta,
              {
                opacity: metaMotion.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.7, 1],
                }),
                transform: [
                  {
                    translateY: metaMotion.interpolate({
                      inputRange: [0, 1],
                      outputRange: [4, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {metaSummary}
          </Animated.Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: LAYER.card,
    borderWidth: 1,
    borderColor: LAYER.border,
    alignItems: "center",
    justifyContent: "center",
    ...CARD_SHADOW,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.2,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: 24,
    backgroundColor: LAYER.card,
    borderWidth: 1,
    borderColor: LAYER.border,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    ...CARD_SHADOW,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: LAYER.border,
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(17, 17, 17, 0.45)",
    letterSpacing: -0.1,
  },
});
