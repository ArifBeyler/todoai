import { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
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
  parsedResult: ParsedTodoInput | null;
  transcript: string;
  onConfirm: (result: ParsedTodoInput) => void;
  onDismiss: () => void;
};

export const VoiceConfirmationSheet = ({
  visible,
  parsedResult,
  transcript,
  onConfirm,
  onDismiss,
}: VoiceConfirmationSheetProps) => {
  const titleInputRef = useRef<TextInput>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDate, setEditedDate] = useState<string | undefined>(undefined);
  const [editedTime, setEditedTime] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!visible || !parsedResult) return;
    setEditedTitle(parsedResult.title ?? "");
    setEditedDate(parsedResult.date);
    setEditedTime(parsedResult.time);
  }, [visible, parsedResult]);

  const handleConfirm = useCallback(() => {
    if (!parsedResult) return;
    onConfirm({
      ...parsedResult,
      title: editedTitle.trim() || parsedResult.title,
      date: editedDate,
      time: editedTime,
    });
  }, [parsedResult, editedTitle, editedDate, editedTime, onConfirm]);

  const handleEditPress = useCallback(() => {
    titleInputRef.current?.focus();
  }, []);

  if (!parsedResult) return null;

  const recurrence = normalizeRecurrence(parsedResult.recurrence);
  const priority = normalizePriority(parsedResult.priority as string | undefined);
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
              <View>
                <Text style={styles.headerTitle}>Sesinden</Text>
                <Text style={styles.headerSub}>Kısa bir kontrol, ardından listeye eklenir.</Text>
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
          <Text style={styles.transcript} numberOfLines={4}>
            {transcript ? `“${transcript}”` : "—"}
          </Text>

          <AIResponseHint text="Bunu senin için göreve dönüştürdüm." />

          <ParsedTaskReviewCard
            fullWidth
            title={parsedResult.title}
            titleEditValue={editedTitle}
            onTitleEditChange={setEditedTitle}
            titleInputRef={titleInputRef}
            scheduleLine={scheduleLine}
            scheduleHint={scheduleHint}
            categoryLabel={categoryToLabelTr(parsedResult.category)}
            recurrenceLabel={recurrenceToLabelTr(recurrence)}
            priorityLabel={priorityToLabelTr(priority)}
            onEdit={handleEditPress}
            onCancel={onDismiss}
            onAddToTasks={handleConfirm}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

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
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
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
});
