import { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { Sparkle, X } from "phosphor-react-native";
import { AIResponseHint } from "@/src/components/AIResponseHint";
import { ParsedTaskReviewCard } from "@/src/components/ParsedTaskReviewCard";
import type { ParsedTodoInput } from "@/src/utils/parseTodoInput";
import {
  categoryToLabelTr,
  formatScheduleHint,
  formatScheduleLine,
  normalizePriority,
  normalizeRecurrence,
  priorityToLabelTr,
  recurrenceToLabelTr,
} from "@/src/utils/taskReviewPresentation";
import { font, radius, semantic, spacing } from "@/src/ui/tokens";

type VoiceConfirmationSheetProps = {
  visible: boolean;
  parsedResults: ParsedTodoInput[];
  transcript: string;
  onConfirm: (results: ParsedTodoInput[]) => void;
  onDismiss: () => void;
};

// Compact read-only card used in the multi-task list
const MultiTaskRow = ({
  task,
  index,
  editedTitle,
  onTitleChange,
}: {
  task: ParsedTodoInput;
  index: number;
  editedTitle: string;
  onTitleChange: (v: string) => void;
}) => {
  const recurrence = normalizeRecurrence(task.recurrence);
  const priority = normalizePriority(task.priority as string | undefined);
  const scheduleLine = formatScheduleLine(task.date, task.time);

  return (
    <View style={rowStyles.container}>
      <View style={rowStyles.indexBadge}>
        <Text style={rowStyles.indexText}>{index + 1}</Text>
      </View>
      <View style={rowStyles.content}>
        <TextInput
          style={rowStyles.titleInput}
          value={editedTitle}
          onChangeText={onTitleChange}
          placeholder="Görev başlığı"
          placeholderTextColor={semantic.textSecondary}
          multiline
          accessibilityLabel={`Görev ${index + 1} başlığı`}
        />
        <View style={rowStyles.meta}>
          {scheduleLine ? (
            <Text style={rowStyles.metaChip}>{scheduleLine}</Text>
          ) : null}
          <Text style={rowStyles.metaChip}>{categoryToLabelTr(task.category)}</Text>
          {recurrence !== "once" ? (
            <Text style={rowStyles.metaChip}>{recurrenceToLabelTr(recurrence)}</Text>
          ) : null}
          <Text style={rowStyles.metaChip}>{priorityToLabelTr(priority)}</Text>
        </View>
      </View>
    </View>
  );
};

export const VoiceConfirmationSheet = ({
  visible,
  parsedResults,
  transcript,
  onConfirm,
  onDismiss,
}: VoiceConfirmationSheetProps) => {
  const titleInputRef = useRef<TextInput>(null);
  const [editedTitles, setEditedTitles] = useState<string[]>([]);
  const [editedDate, setEditedDate] = useState<string | undefined>(undefined);
  const [editedTime, setEditedTime] = useState<string | undefined>(undefined);

  const isMulti = parsedResults.length > 1;
  const singleResult = parsedResults[0] ?? null;

  useEffect(() => {
    if (!visible || parsedResults.length === 0) return;
    setEditedTitles(parsedResults.map((r) => r.title ?? ""));
    setEditedDate(singleResult?.date);
    setEditedTime(singleResult?.time);
  }, [visible, parsedResults]);

  const handleConfirmSingle = useCallback(() => {
    if (!singleResult) return;
    onConfirm([{
      ...singleResult,
      title: editedTitles[0]?.trim() || singleResult.title,
      date: editedDate,
      time: editedTime,
    }]);
  }, [singleResult, editedTitles, editedDate, editedTime, onConfirm]);

  const handleConfirmAll = useCallback(() => {
    const results = parsedResults.map((task, i) => ({
      ...task,
      title: editedTitles[i]?.trim() || task.title,
    }));
    onConfirm(results);
  }, [parsedResults, editedTitles, onConfirm]);

  const handleEditPress = useCallback(() => {
    titleInputRef.current?.focus();
  }, []);

  const handleTitleChange = useCallback((index: number, value: string) => {
    setEditedTitles((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  if (parsedResults.length === 0) return null;

  const recurrence = normalizeRecurrence(singleResult?.recurrence);
  const priority = normalizePriority(singleResult?.priority as string | undefined);
  const scheduleLine = formatScheduleLine(editedDate, editedTime);
  const scheduleHint = formatScheduleHint(editedDate, editedTime);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={onDismiss}
            activeOpacity={1}
            accessibilityLabel="Kapat"
          />
        </Animated.View>

        <Animated.View entering={SlideInDown.duration(380).springify().damping(22)} style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Sparkle size={16} color={semantic.textOnDark} weight="fill" />
              </View>
              <View style={styles.headerTextBlock}>
                <Text style={styles.headerTitle}>Sesinden</Text>
                <Text style={styles.headerSub}>
                  {isMulti
                    ? `${parsedResults.length} görev bulundu. Kontrol et ve ekle.`
                    : "Kısa bir kontrol, ardından listeye eklenir."}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              style={styles.closeBtn}
              hitSlop={12}
            >
              <X size={22} color={semantic.textSecondary} weight="regular" />
            </TouchableOpacity>
          </View>

          <Text style={styles.transcriptLabel}>Dediğin</Text>
          <Text style={styles.transcript} numberOfLines={3}>
            {transcript ? `"${transcript}"` : "—"}
          </Text>

          <AIResponseHint
            text={
              isMulti
                ? `${parsedResults.length} ayrı görevi senin için düzenledim.`
                : "Bunu senin için göreve dönüştürdüm."
            }
          />

          {isMulti ? (
            // ── Multi-task view ──
            <ScrollView
              style={styles.multiScroll}
              contentContainerStyle={styles.multiScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {parsedResults.map((task, i) => (
                <MultiTaskRow
                  key={i}
                  task={task}
                  index={i}
                  editedTitle={editedTitles[i] ?? task.title}
                  onTitleChange={(v) => handleTitleChange(i, v)}
                />
              ))}
            </ScrollView>
          ) : (
            // ── Single-task view ──
            <ParsedTaskReviewCard
              fullWidth
              title={singleResult!.title}
              titleEditValue={editedTitles[0] ?? ""}
              onTitleEditChange={(v) => handleTitleChange(0, v)}
              titleInputRef={titleInputRef}
              scheduleLine={scheduleLine}
              scheduleHint={scheduleHint}
              categoryLabel={categoryToLabelTr(singleResult?.category)}
              recurrenceLabel={recurrenceToLabelTr(recurrence)}
              priorityLabel={priorityToLabelTr(priority)}
              onEdit={handleEditPress}
              onCancel={onDismiss}
              onAddToTasks={handleConfirmSingle}
            />
          )}

          {isMulti && (
            <View style={styles.multiActions}>
              <TouchableOpacity
                style={styles.ghostBtn}
                onPress={onDismiss}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Vazgeç"
              >
                <Text style={styles.ghostBtnText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleConfirmAll}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={`Tümünü ekle (${parsedResults.length})`}
              >
                <Text style={styles.primaryBtnText}>
                  Tümünü Ekle ({parsedResults.length})
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
  },
  indexBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    flexShrink: 0,
  },
  indexText: {
    fontSize: 12,
    fontFamily: font.bold,
    fontWeight: "700",
    color: semantic.textOnDark,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  titleInput: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: font.semiBold,
    fontWeight: "600",
    color: semantic.textPrimary,
    letterSpacing: -0.25,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: semantic.appBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    minHeight: 40,
    textAlignVertical: "top",
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaChip: {
    fontSize: 11.5,
    fontFamily: font.medium,
    fontWeight: "500",
    color: semantic.textSecondary,
    backgroundColor: semantic.appBackground,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
  },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: semantic.screenSurface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl + 8,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    maxHeight: "85%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: semantic.border,
    alignSelf: "center",
    marginBottom: spacing.sm,
    opacity: 0.9,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: font.bold,
    fontWeight: "700",
    color: semantic.textPrimary,
    letterSpacing: -0.35,
  },
  headerSub: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: font.regular,
    color: semantic.textSecondary,
  },
  closeBtn: {
    padding: spacing.xxs,
    marginTop: 2,
  },
  transcriptLabel: {
    fontSize: 11,
    fontFamily: font.bold,
    fontWeight: "700",
    color: semantic.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: spacing.xs,
  },
  transcript: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: font.medium,
    fontWeight: "500",
    color: semantic.textPrimary,
    letterSpacing: -0.2,
    opacity: 0.88,
  },
  multiScroll: {
    flexGrow: 0,
    maxHeight: 280,
  },
  multiScrollContent: {
    paddingBottom: spacing.xs,
  },
  multiActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.xs,
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
  primaryBtn: {
    flex: 1,
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
