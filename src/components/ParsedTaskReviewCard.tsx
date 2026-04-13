import type { RefObject } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { PencilSimple } from "phosphor-react-native";
import { font, radius, semantic, shadow, spacing } from "@/src/ui/tokens";
import { ReviewBadge } from "@/src/components/ReviewBadge";

export type ParsedTaskReviewCardProps = {
  title: string;
  scheduleLine: string | null;
  scheduleHint?: string | null;
  categoryLabel: string;
  recurrenceLabel: string;
  priorityLabel: string;
  onEdit: () => void;
  onCancel: () => void;
  onAddToTasks: () => void;
  /** Use full width inside bottom sheets */
  fullWidth?: boolean;
  /** When set, başlık alanı düzenlenebilir input olur (ses onayı vb.) */
  titleEditValue?: string;
  onTitleEditChange?: (value: string) => void;
  titleInputRef?: RefObject<TextInput | null>;
};

export const ParsedTaskReviewCard = ({
  title,
  scheduleLine,
  scheduleHint,
  categoryLabel,
  recurrenceLabel,
  priorityLabel,
  onEdit,
  onCancel,
  onAddToTasks,
  fullWidth = false,
  titleEditValue,
  onTitleEditChange,
  titleInputRef,
}: ParsedTaskReviewCardProps) => {
  const isTitleEditable = onTitleEditChange != null;
  const displayTitle = titleEditValue ?? title;

  return (
  <View style={[styles.card, fullWidth && styles.cardFull]} accessibilityRole="summary">
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>Önerilen görev</Text>
      <Text style={styles.cardHelper}>
        İstersen düzenle, hazırsan tek dokunuşla ekle.
      </Text>
    </View>

    <View style={styles.divider} />

    <View style={styles.block}>
      <Text style={styles.fieldLabel}>Başlık</Text>
      {isTitleEditable ? (
        <TextInput
          ref={titleInputRef}
          style={styles.titleInput}
          value={displayTitle}
          onChangeText={onTitleEditChange}
          placeholder="Görev başlığı"
          placeholderTextColor={semantic.textSecondary}
          accessibilityLabel="Görev başlığını düzenle"
          multiline
        />
      ) : (
        <Text style={styles.titleValue} numberOfLines={4}>
          {displayTitle}
        </Text>
      )}
    </View>

    {scheduleLine ? (
      <>
        <View style={styles.dividerSoft} />
        <View style={styles.block}>
          <Text style={styles.fieldLabel}>Zaman</Text>
          <Text style={styles.scheduleLine}>{scheduleLine}</Text>
          {scheduleHint ? <Text style={styles.scheduleHint}>{scheduleHint}</Text> : null}
        </View>
      </>
    ) : null}

    <View style={styles.dividerSoft} />

    <View style={styles.block}>
      <Text style={styles.fieldLabel}>Detaylar</Text>
      <View style={styles.badgeRow}>
        <ReviewBadge label={categoryLabel} />
        <ReviewBadge label={recurrenceLabel} />
        <ReviewBadge label={priorityLabel} />
      </View>
    </View>

    <View style={styles.divider} />

    <View style={styles.actionRow}>
      <TouchableOpacity
        style={styles.ghostBtn}
        onPress={onCancel}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Vazgeç"
      >
        <Text style={styles.ghostBtnText}>Vazgeç</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={onEdit}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel="Düzenle"
      >
        <PencilSimple size={15} color={semantic.textPrimary} weight="bold" />
        <Text style={styles.secondaryBtnText}>Düzenle</Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      style={styles.primaryBtn}
      onPress={onAddToTasks}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel="Göreve ekle"
    >
      <Text style={styles.primaryBtnText}>Göreve ekle</Text>
    </TouchableOpacity>
  </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "92%",
    maxWidth: 400,
    alignSelf: "center",
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    backgroundColor: semantic.screenSurface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    ...shadow.soft,
  },
  cardFull: {
    width: "100%",
    maxWidth: undefined,
    alignSelf: "stretch",
  },
  cardHeader: {
    gap: spacing.xxs,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: font.bold,
    fontWeight: "700",
    color: semantic.textSecondary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  cardHelper: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    opacity: 0.92,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: semantic.border,
    opacity: 0.85,
    marginVertical: spacing.sm,
  },
  dividerSoft: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: semantic.border,
    opacity: 0.45,
    marginVertical: spacing.sm,
  },
  block: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: font.medium,
    fontWeight: "500",
    color: semantic.textSecondary,
    letterSpacing: -0.1,
  },
  titleValue: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: font.semiBold,
    fontWeight: "600",
    color: semantic.textPrimary,
    letterSpacing: -0.35,
  },
  titleInput: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: font.semiBold,
    fontWeight: "600",
    color: semantic.textPrimary,
    letterSpacing: -0.35,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: semantic.appBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    minHeight: 48,
    textAlignVertical: "top",
  },
  scheduleLine: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: font.semiBold,
    fontWeight: "600",
    color: semantic.textPrimary,
    letterSpacing: -0.25,
  },
  scheduleHint: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: font.regular,
    color: semantic.textSecondary,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  ghostBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    minWidth: 72,
  },
  ghostBtnText: {
    fontSize: 14,
    fontFamily: font.medium,
    fontWeight: "500",
    color: semantic.textSecondary,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    backgroundColor: semantic.appBackground,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: font.semiBold,
    fontWeight: "600",
    color: semantic.textPrimary,
  },
  primaryBtn: {
    borderRadius: radius.md,
    backgroundColor: semantic.heroStart,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: font.bold,
    fontWeight: "700",
    color: semantic.textOnDark,
    letterSpacing: -0.2,
  },
});
