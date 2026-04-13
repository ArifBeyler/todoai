import { useCallback, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { Calendar, Clock, Tag, Waveform, X } from "phosphor-react-native";
import { radius, semantic, spacing } from "@/src/ui/tokens";
import type { ParsedTodoInput } from "@/src/utils/parseTodoInput";

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
  const [editedTitle, setEditedTitle] = useState(parsedResult?.title ?? "");
  const [editedDate, setEditedDate] = useState(parsedResult?.date);
  const [editedTime, setEditedTime] = useState(parsedResult?.time);

  const handleConfirm = useCallback(() => {
    if (!parsedResult) return;
    onConfirm({
      ...parsedResult,
      title: editedTitle || parsedResult.title,
      date: editedDate,
      time: editedTime,
    });
  }, [parsedResult, editedTitle, editedDate, editedTime, onConfirm]);

  if (!parsedResult) return null;

  const hasAmbiguities = parsedResult.ambiguities && parsedResult.ambiguities.length > 0;

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
          />
        </Animated.View>

        <Animated.View entering={SlideInDown.duration(400).springify()} style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Waveform size={20} color={semantic.accent} weight="fill" />
              <Text style={styles.headerTitle}>Ses ile Görev</Text>
            </View>
            <TouchableOpacity onPress={onDismiss} accessibilityRole="button">
              <X size={22} color="#8A7A70" weight="regular" />
            </TouchableOpacity>
          </View>

          <Text style={styles.transcriptLabel}>Algılanan metin</Text>
          <Text style={styles.transcript}>"{transcript}"</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Görev başlığı</Text>
            <TextInput
              style={styles.input}
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Görev başlığı"
              placeholderTextColor="#B2A498"
              autoFocus={false}
            />
          </View>

          <View style={styles.chipRow}>
            {editedDate && (
              <TouchableOpacity
                style={styles.chipButton}
                onPress={() => setEditedDate(undefined)}
                accessibilityRole="button"
              >
                <Calendar size={14} color="#5C4E46" />
                <Text style={styles.chipText}>{editedDate}</Text>
                <X size={12} color="#8A7A70" />
              </TouchableOpacity>
            )}

            {editedTime && (
              <TouchableOpacity
                style={[
                  styles.chipButton,
                  hasAmbiguities &&
                    parsedResult.ambiguities?.includes("time_ambiguous") &&
                    styles.chipAmbiguous,
                ]}
                onPress={() => setEditedTime(undefined)}
                accessibilityRole="button"
              >
                <Clock size={14} color={hasAmbiguities ? "#C86A62" : "#5C4E46"} />
                <Text
                  style={[
                    styles.chipText,
                    hasAmbiguities &&
                      parsedResult.ambiguities?.includes("time_ambiguous") &&
                      styles.chipTextAmbiguous,
                  ]}
                >
                  {editedTime}
                </Text>
                <X size={12} color="#8A7A70" />
              </TouchableOpacity>
            )}

            {parsedResult.category && (
              <View style={styles.chipButton}>
                <Tag size={14} color="#5C4E46" />
                <Text style={styles.chipText}>{parsedResult.category}</Text>
              </View>
            )}
          </View>

          {hasAmbiguities && (
            <Text style={styles.ambiguityNote}>
              Turuncu alanlar belirsiz — dokunarak düzenleyebilirsin
            </Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.88}
              accessibilityRole="button"
            >
              <Text style={styles.confirmText}>Oluştur</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editButton}
              onPress={onDismiss}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.editText}>İptal</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#FDFAF6",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 40,
    gap: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E3DF",
    alignSelf: "center",
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3A2E28",
  },
  transcriptLabel: {
    fontSize: 12,
    color: "#8A7A70",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  transcript: {
    fontSize: 15,
    color: "#5C4E46",
    fontWeight: "500",
    fontStyle: "italic",
    lineHeight: 22,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8A7A70",
  },
  input: {
    borderRadius: radius.lg,
    backgroundColor: "#F2EEE8",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "500",
    color: "#3A2E28",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: "#F2EEE8",
  },
  chipAmbiguous: {
    backgroundColor: "#FFF1EF",
    borderWidth: 1,
    borderColor: "#E8C5BE",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3A2E28",
  },
  chipTextAmbiguous: {
    color: "#C86A62",
  },
  ambiguityNote: {
    fontSize: 12,
    color: "#C86A62",
    fontWeight: "500",
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  confirmButton: {
    backgroundColor: semantic.accent,
    borderRadius: radius.xl,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  editButton: {
    borderRadius: radius.xl,
    paddingVertical: 14,
    alignItems: "center",
  },
  editText: {
    color: "#8A7A70",
    fontSize: 15,
    fontWeight: "600",
  },
});
