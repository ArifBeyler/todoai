import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import {
  ArrowLeft,
  Microphone,
  PaperPlaneTilt,
  Sparkle,
  StopCircle,
} from "phosphor-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AIResponseHint } from "@/src/components/AIResponseHint";
import { QuickSuggestionsBar } from "@/src/components/ai/QuickSuggestionsBar";
import { ParsedTaskReviewCard } from "@/src/components/ParsedTaskReviewCard";
import { VoiceConfirmationSheet } from "@/src/components/VoiceConfirmationSheet";
import { useVoiceInput } from "@/src/hooks/useVoiceInput";
import { useTodoStore } from "@/src/state/useTodoStore";
import type { Recurrence } from "@/src/state/useTodoStore";
import { font, radius, semantic, shadow, spacing } from "@/src/ui/tokens";
import type { ParsedTodoInput } from "@/src/utils/parseTodoInput";
import { parseTodoInputsWithLLM } from "@/src/utils/parseTodoInputLLM";
import {
  categoryToLabelTr,
  formatScheduleHint,
  formatScheduleLine,
  normalizePriority,
  normalizeRecurrence,
  priorityToLabelTr,
  recurrenceToLabelTr,
} from "@/src/utils/taskReviewPresentation";

type SuggestedTask = {
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
  recurrence: Recurrence;
  parsed: ParsedTodoInput;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  taskSuggestion?: SuggestedTask;
  taskSuggestions?: SuggestedTask[];
  isLoading?: boolean;
};


const AI_TASK_READY_HINT = "Bunu senin için göreve dönüştürdüm.";

const randomId = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const parsedToSuggestion = (text: string, parsed: ParsedTodoInput): SuggestedTask => ({
  title: parsed.title || text,
  category: parsed.category ?? "other",
  priority: normalizePriority(parsed.priority as string | undefined),
  recurrence: normalizeRecurrence(parsed.recurrence),
  parsed,
});

export default function AiAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [voiceSheetVisible, setVoiceSheetVisible] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const addTodo = useTodoStore((s) => s.addTodo);

  const {
    isRecording,
    isProcessing,
    transcript,
    parsedResults: voiceParsedResults,
    error: voiceError,
    startRecording,
    stopRecording,
    cancelRecording,
    reset: resetVoice,
    getErrorMessage,
    isAvailable: isVoiceAvailable,
  } = useVoiceInput();

  useEffect(() => {
    if (voiceParsedResults && voiceParsedResults.length > 0 && transcript) {
      setVoiceSheetVisible(true);
    }
  }, [voiceParsedResults, transcript]);

  const lastVoiceErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!voiceError) {
      lastVoiceErrorRef.current = null;
      return;
    }
    if (lastVoiceErrorRef.current === voiceError) return;
    lastVoiceErrorRef.current = voiceError;

    const errorMsg = getErrorMessage(voiceError);
    setMessages((prev) => [
      ...prev,
      {
        id: randomId(),
        role: "assistant",
        text: errorMsg || "Ses girişi sırasında bir hata oluştu.",
      },
    ]);
    resetVoice();
  }, [voiceError, getErrorMessage, resetVoice]);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  }, []);

  const addSuggestion = useCallback(
    (suggestion: SuggestedTask) => {
      addTodo({
        title: suggestion.title,
        category: suggestion.category,
        priority: suggestion.priority,
        recurrence: suggestion.recurrence,
      });
    },
    [addTodo],
  );

  const handleConfirmTodo = useCallback(
    (suggestion: SuggestedTask) => {
      addSuggestion(suggestion);
      setVoiceSheetVisible(false);
      resetVoice();
      router.back();
    },
    [addSuggestion, resetVoice],
  );

  const handleVoiceConfirm = useCallback(
    (results: ParsedTodoInput[]) => {
      results.forEach((parsed) => {
        const suggestion = parsedToSuggestion(transcript ?? "", parsed);
        addSuggestion(suggestion);
      });
      setVoiceSheetVisible(false);
      resetVoice();
      router.back();
    },
    [transcript, addSuggestion, resetVoice],
  );

  // Single task approval from chat bubble — goes back
  const handleApprove = useCallback(
    (suggestion: SuggestedTask) => {
      handleConfirmTodo(suggestion);
    },
    [handleConfirmTodo],
  );

  // Approve one task from a multi-task chat bubble — adds it and removes from list
  const handleApproveOne = useCallback(
    (suggestion: SuggestedTask, messageId: string) => {
      addSuggestion(suggestion);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.taskSuggestions
            ? {
                ...m,
                taskSuggestions: m.taskSuggestions.filter((s) => s !== suggestion),
              }
            : m,
        ),
      );
    },
    [addSuggestion],
  );

  // Dismiss one task from a multi-task bubble without adding it
  const handleDismissOne = useCallback(
    (suggestion: SuggestedTask, messageId: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.taskSuggestions
            ? {
                ...m,
                taskSuggestions: m.taskSuggestions.filter((s) => s !== suggestion),
              }
            : m,
        ),
      );
    },
    [],
  );

  // Approve all tasks from a multi-task chat bubble — goes back
  const handleApproveAll = useCallback(
    (suggestions: SuggestedTask[]) => {
      suggestions.forEach(addSuggestion);
      router.back();
    },
    [addSuggestion],
  );

  const handleEdit = useCallback((suggestion: SuggestedTask) => {
    setInputValue(suggestion.title);
  }, []);

  const handleCancel = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              taskSuggestion: undefined,
              taskSuggestions: undefined,
              text: "Tamam, vazgeçtim. Başka ne ekleyelim?",
            }
          : m,
      ),
    );
  }, []);

  const handleSend = useCallback(
    async (value?: string) => {
      const text = (value ?? inputValue).trim();
      if (!text) return;

      setInputValue("");
      const userMsgId = randomId();
      const loadingMsgId = randomId();

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", text },
        { id: loadingMsgId, role: "assistant", text: "", isLoading: true },
      ]);
      scrollToEnd();

      const parsedList = await parseTodoInputsWithLLM(text, "tr");

      if (parsedList.length === 1) {
        const suggestion = parsedToSuggestion(text, parsedList[0]);
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== loadingMsgId)
            .concat([{ id: randomId(), role: "assistant", text: "", taskSuggestion: suggestion }]),
        );
      } else {
        const suggestions = parsedList.map((p) => parsedToSuggestion(text, p));
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== loadingMsgId)
            .concat([{ id: randomId(), role: "assistant", text: "", taskSuggestions: suggestions }]),
        );
      }

      scrollToEnd();
    },
    [inputValue, scrollToEnd],
  );

  const handleVoicePress = useCallback(async () => {
    if (!isVoiceAvailable) return;
    if (isRecording) {
      await stopRecording();
      return;
    }
    if (isProcessing) return;
    const started = await startRecording();
    if (!started) {
      router.push("/permissions/microphone" as never);
    }
  }, [isVoiceAvailable, isRecording, isProcessing, startRecording, stopRecording]);

  const voiceButtonLabel = isRecording
    ? "Kaydı durdur"
    : isProcessing
      ? "İşleniyor..."
      : "Sesle görev ekle";

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <ArrowLeft size={20} color={semantic.textPrimary} weight="bold" />
          </TouchableOpacity>

          <View style={styles.titleBlock}>
            <Text style={styles.screenTitle}>AI Görev Asistanı</Text>
            <Text style={styles.screenSub}>
              Doğal dil ile ekle; net bir görev kartı olarak önünde durur.
            </Text>
          </View>

          <View style={styles.sparkleBadge}>
            <Sparkle size={15} color={semantic.textOnDark} weight="fill" />
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          {messages.length === 0 ? (
            <Animated.View entering={FadeIn.delay(100).duration(350)} style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Sparkle size={22} color={semantic.textOnDark} weight="fill" />
              </View>
              <Text style={styles.emptyTitle}>Hazırım</Text>
              <Text style={styles.emptyText}>
                Bir cümle yaz veya mikrofona dokun. Görevini sade, düzenli bir önizlemede birleştiririm.
              </Text>
            </Animated.View>
          ) : null}

          {messages.map((msg) => (
            <Animated.View
              key={msg.id}
              entering={FadeInUp.duration(220)}
              style={[
                styles.messageWrap,
                msg.role === "user" ? styles.userMessageWrap : styles.assistantMessageWrap,
              ]}
            >
              {msg.role === "user" ? (
                <View style={[styles.messageBubble, styles.userBubble]}>
                  <Text style={[styles.messageText, styles.userText]}>{msg.text}</Text>
                </View>
              ) : null}

              {msg.role === "assistant" && msg.isLoading ? (
                <View style={[styles.messageBubble, styles.assistantBubbleLoading]}>
                  <ActivityIndicator size="small" color={semantic.textSecondary} />
                </View>
              ) : null}

              {msg.role === "assistant" && !msg.isLoading && msg.text && !msg.taskSuggestion ? (
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <Text style={[styles.messageText, styles.assistantText]}>{msg.text}</Text>
                </View>
              ) : null}

              {msg.taskSuggestion ? (
                <View style={styles.reviewBlock}>
                  <AIResponseHint text={AI_TASK_READY_HINT} />
                  <ParsedTaskReviewCard
                    title={msg.taskSuggestion.title}
                    scheduleLine={formatScheduleLine(
                      msg.taskSuggestion.parsed.date,
                      msg.taskSuggestion.parsed.time,
                    )}
                    scheduleHint={formatScheduleHint(
                      msg.taskSuggestion.parsed.date,
                      msg.taskSuggestion.parsed.time,
                    )}
                    categoryLabel={categoryToLabelTr(msg.taskSuggestion.category)}
                    recurrenceLabel={recurrenceToLabelTr(msg.taskSuggestion.recurrence)}
                    priorityLabel={priorityToLabelTr(msg.taskSuggestion.priority)}
                    onEdit={() => handleEdit(msg.taskSuggestion!)}
                    onCancel={() => handleCancel(msg.id)}
                    onAddToTasks={() => handleApprove(msg.taskSuggestion!)}
                  />
                </View>
              ) : null}

              {msg.taskSuggestions && msg.taskSuggestions.length > 0 ? (
                <View style={styles.reviewBlock}>
                  <AIResponseHint
                    text={`${msg.taskSuggestions.length} ayrı görevi düzenledim.`}
                  />
                  {msg.taskSuggestions.map((s, idx) => (
                    <ParsedTaskReviewCard
                      key={idx}
                      title={s.title}
                      scheduleLine={formatScheduleLine(s.parsed.date, s.parsed.time)}
                      scheduleHint={formatScheduleHint(s.parsed.date, s.parsed.time)}
                      categoryLabel={categoryToLabelTr(s.category)}
                      recurrenceLabel={recurrenceToLabelTr(s.recurrence)}
                      priorityLabel={priorityToLabelTr(s.priority)}
                      onEdit={() => handleEdit(s)}
                      onCancel={() => handleDismissOne(s, msg.id)}
                      onAddToTasks={() => handleApproveOne(s, msg.id)}
                    />
                  ))}
                  <TouchableOpacity
                    style={styles.addAllBtn}
                    onPress={() => handleApproveAll(msg.taskSuggestions!)}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel={`Tümünü ekle (${msg.taskSuggestions.length})`}
                  >
                    <Text style={styles.addAllBtnText}>
                      Tümünü Ekle ({msg.taskSuggestions.length})
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </Animated.View>
          ))}

          {isRecording && (
            <Animated.View entering={FadeInUp.duration(250)} style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Dinliyorum… Bitirmek için tekrar dokun.</Text>
            </Animated.View>
          )}
          {isProcessing && (
            <Animated.View entering={FadeInUp.duration(250)} style={styles.recordingIndicator}>
              <ActivityIndicator size="small" color={semantic.textSecondary} />
              <Text style={styles.recordingText}>Sesini düzenli bir göreve çeviriyorum…</Text>
            </Animated.View>
          )}
        </ScrollView>

        <QuickSuggestionsBar onSelect={handleSend} />

        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[
              styles.voiceButton,
              isRecording && styles.voiceButtonRecording,
              isProcessing && styles.voiceButtonProcessing,
            ]}
            onPress={handleVoicePress}
            activeOpacity={0.85}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityLabel={voiceButtonLabel}
          >
            {isRecording ? (
              <StopCircle size={17} color={semantic.danger} weight="fill" />
            ) : isProcessing ? (
              <ActivityIndicator size="small" color={semantic.textSecondary} />
            ) : (
              <Microphone size={17} color={semantic.textOnDark} weight="fill" />
            )}
          </TouchableOpacity>

          <View style={styles.inputWrap}>
            <TextInput
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Ne yapman gerekiyor?"
              placeholderTextColor={semantic.textSecondary}
              style={styles.input}
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, !inputValue.trim() && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!inputValue.trim()}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Gönder"
          >
            <PaperPlaneTilt
              size={16}
              color={inputValue.trim() ? semantic.textOnDark : semantic.textSecondary}
              weight="fill"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerHint}>Yaz veya konuş — düzenlenmiş görevi onayla.</Text>
      </KeyboardAvoidingView>

      <VoiceConfirmationSheet
        visible={voiceSheetVisible}
        parsedResults={voiceParsedResults ?? []}
        transcript={transcript ?? ""}
        onConfirm={handleVoiceConfirm}
        onDismiss={() => {
          setVoiceSheetVisible(false);
          cancelRecording();
          resetVoice();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semantic.appBackground,
  },
  flex: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md + 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: semantic.screenSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    ...shadow.card,
  },
  titleBlock: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -0.45,
  },
  screenSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    letterSpacing: -0.05,
    maxWidth: 260,
  },
  sparkleBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  chatArea: {
    flex: 1,
  },
  chatContent: {
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },

  emptyState: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    backgroundColor: semantic.screenSurface,
    padding: spacing.xl,
    alignItems: "center",
    marginTop: spacing.xs,
    ...shadow.card,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -0.25,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    textAlign: "center",
  },

  messageWrap: {
    gap: spacing.sm,
  },
  userMessageWrap: {
    alignItems: "flex-end",
  },
  assistantMessageWrap: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "88%",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  userBubble: {
    borderTopRightRadius: radius.sm,
    backgroundColor: semantic.textPrimary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
  },
  assistantBubble: {
    backgroundColor: semantic.screenSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
  },
  assistantBubbleLoading: {
    backgroundColor: semantic.screenSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    minWidth: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: font.regular,
    letterSpacing: -0.2,
  },
  userText: {
    color: semantic.textOnDark,
    fontFamily: font.medium,
    fontWeight: "500",
  },
  assistantText: {
    color: semantic.textPrimary,
  },

  reviewBlock: {
    width: "100%",
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  addAllBtn: {
    borderRadius: radius.md,
    backgroundColor: semantic.heroStart,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  addAllBtnText: {
    fontSize: 16,
    fontFamily: font.bold,
    fontWeight: "700",
    color: semantic.textOnDark,
    letterSpacing: -0.2,
  },

  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: semantic.screenSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    alignSelf: "flex-start",
    maxWidth: "92%",
  },
  recordingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: semantic.danger,
  },
  recordingText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: font.regular,
    color: semantic.textSecondary,
  },

  chipsSection: {
    marginTop: spacing.sm,
    marginBottom: 6,
    overflow: "visible",
  },
  chipsSectionLabel: {
    fontSize: 11,
    fontFamily: font.medium,
    fontWeight: "500",
    color: semantic.textSecondary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
    marginLeft: 2,
    opacity: 0.85,
  },
  chipsScroll: {
    marginHorizontal: -4,
  },
  chipsScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 10,
  },
  chipPill: {
    flexShrink: 0,
    height: 40,
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.12)",
    paddingHorizontal: spacing.md,
    paddingVertical: 0,
  },
  chipPillPressed: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderColor: "rgba(0,0,0,0.20)",
  },
  chipPillText: {
    fontSize: 13.5,
    lineHeight: 18,
    fontFamily: font.medium,
    fontWeight: "500",
    color: semantic.textPrimary,
    letterSpacing: -0.2,
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceButtonRecording: {
    backgroundColor: semantic.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.danger,
  },
  voiceButtonProcessing: {
    backgroundColor: semantic.border,
  },
  inputWrap: {
    flex: 1,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    backgroundColor: semantic.screenSurface,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    justifyContent: "center",
  },
  input: {
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 15,
    fontFamily: font.regular,
    color: semantic.textPrimary,
    letterSpacing: -0.15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: semantic.border,
  },

  footerHint: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    textAlign: "center",
    letterSpacing: -0.05,
    opacity: 0.9,
  },
});
