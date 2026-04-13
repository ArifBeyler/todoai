import { useMemo, useRef, useState } from "react";
import {
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
  PencilSimple,
  Sparkle,
  X,
} from "phosphor-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { font, radius, semantic, shadow, spacing } from "@/src/ui/tokens";

type SuggestedTask = {
  title: string;
  category: string;
  dateTime: string;
  priority: "Düşük" | "Orta" | "Yüksek";
};

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  taskSuggestion?: SuggestedTask;
};

const QUICK_SUGGESTIONS = [
  "Bugün için görev ekle",
  "Haftalık plan yap",
  "Alışkanlık oluştur",
  "Yarın için hatırlatıcı",
];

const VOICE_SAMPLE = "Yarın sabah spor yapmayı hatırlat";

const randomId = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const inferMockTask = (source: string): SuggestedTask => {
  const normalized = source.toLowerCase();
  const title = source.trim() || "Yeni görev";

  let category = "Kişisel";
  if (normalized.includes("spor") || normalized.includes("yürüyüş")) category = "Sağlık";
  if (normalized.includes("market") || normalized.includes("alışveriş")) category = "Alışveriş";
  if (normalized.includes("iş") || normalized.includes("toplantı")) category = "İş";
  if (normalized.includes("ders") || normalized.includes("öğren")) category = "Eğitim";

  let dateTime = "Bugün, 18:00";
  if (normalized.includes("yarın")) dateTime = "Yarın, 09:00";
  if (normalized.includes("hafta")) dateTime = "Bu hafta, tekrarlayan";
  if (normalized.includes("sabah")) dateTime = "Yarın, 08:00";

  let priority: SuggestedTask["priority"] = "Orta";
  if (normalized.includes("acil") || normalized.includes("önemli")) priority = "Yüksek";
  if (normalized.includes("hatırlat")) priority = "Düşük";

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    category,
    dateTime,
    priority,
  };
};

const TaskSuggestionCard = ({
  suggestion,
  onApprove,
  onEdit,
  onCancel,
}: {
  suggestion: SuggestedTask;
  onApprove: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) => (
  <View style={styles.suggestionCard}>
    <Text style={styles.suggestionTitle}>Önerilen görev</Text>
    {[
      ["Başlık", suggestion.title],
      ["Kategori", suggestion.category],
      ["Tarih / Saat", suggestion.dateTime],
      ["Öncelik", suggestion.priority],
    ].map(([label, value]) => (
      <View key={label} style={styles.suggestionRow}>
        <Text style={styles.suggestionLabel}>{label}</Text>
        <Text style={styles.suggestionValue}>{value}</Text>
      </View>
    ))}
    <View style={styles.suggestionActions}>
      <TouchableOpacity style={styles.secondaryAction} onPress={onEdit}>
        <PencilSimple size={13} color={semantic.textPrimary} weight="bold" />
        <Text style={styles.secondaryActionText}>Düzenle</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ghostAction} onPress={onCancel}>
        <X size={13} color={semantic.textSecondary} weight="bold" />
        <Text style={styles.ghostActionText}>İptal</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.primaryAction} onPress={onApprove}>
        <Text style={styles.primaryActionText}>Onayla</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function AiAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = (value?: string) => {
    const text = (value ?? inputValue).trim();
    if (!text) return;

    const suggestedTask = inferMockTask(text);
    setMessages((prev) => [
      ...prev,
      { id: randomId(), role: "user", text },
      {
        id: randomId(),
        role: "assistant",
        text: "Anladım. Bunu görev olarak şu şekilde hazırladım:",
        taskSuggestion: suggestedTask,
      },
    ]);
    setInputValue("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  };

  const handleVoice = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      handleSend(VOICE_SAMPLE);
    }, 1100);
  };

  const lastSuggestionTitle = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].taskSuggestion) return messages[i].taskSuggestion?.title;
    }
    return null;
  }, [messages]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        {/* Top bar */}
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
            <Text style={styles.screenSub}>Konuşarak veya yazarak görev yönet</Text>
          </View>

          <View style={styles.sparkleBadge}>
            <Sparkle size={15} color={semantic.textOnDark} weight="fill" />
          </View>
        </View>

        {/* Chat area */}
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
              <Text style={styles.emptyTitle}>Akıllı asistan hazır</Text>
              <Text style={styles.emptyText}>
                Doğal bir cümle yaz, sesinle konuş ya da hızlı önerilerden birini seç. Görevi senin için net bir karta dönüştüreyim.
              </Text>
            </Animated.View>
          ) : null}

          {messages.map((msg, idx) => (
            <Animated.View
              key={msg.id}
              entering={FadeInUp.delay(idx === messages.length - 1 || idx === messages.length - 2 ? 0 : 0).duration(220)}
              style={[
                styles.messageWrap,
                msg.role === "user" ? styles.userMessageWrap : styles.assistantMessageWrap,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  msg.role === "user" ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.role === "user" ? styles.userText : styles.assistantText,
                  ]}
                >
                  {msg.text}
                </Text>
              </View>

              {msg.taskSuggestion ? (
                <TaskSuggestionCard
                  suggestion={msg.taskSuggestion}
                  onApprove={() =>
                    setMessages((prev) => [
                      ...prev,
                      { id: randomId(), role: "assistant", text: "Harika! Görev listene eklendi." },
                    ])
                  }
                  onEdit={() => setInputValue(msg.taskSuggestion?.title ?? "")}
                  onCancel={() =>
                    setMessages((prev) => [
                      ...prev,
                      { id: randomId(), role: "assistant", text: "Tamam, bu öneriyi iptal ettim. Yeni bir komut verebilirsin." },
                    ])
                  }
                />
              ) : null}
            </Animated.View>
          ))}
        </ScrollView>

        {/* Quick suggestions */}
        <View style={styles.chipsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContent}
          >
            {QUICK_SUGGESTIONS.map((item) => (
              <Pressable
                key={item}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                onPress={() => handleSend(item)}
              >
                <Text style={styles.chipText}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
            onPress={handleVoice}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Sesle görev ekle"
          >
            <Microphone
              size={18}
              color={isRecording ? semantic.accent : semantic.textOnDark}
              weight="fill"
            />
          </TouchableOpacity>

          <View style={styles.inputWrap}>
            <TextInput
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Ör. Yarın sabah spor yapmayı hatırlat"
              placeholderTextColor={semantic.textSecondary}
              style={styles.input}
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, !inputValue.trim() && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Gönder"
          >
            <PaperPlaneTilt
              size={17}
              color={inputValue.trim() ? semantic.textOnDark : semantic.textSecondary}
              weight="fill"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerHint}>
          {lastSuggestionTitle
            ? `Son öneri: ${lastSuggestionTitle}`
            : "Asistan görevlerini daha net ve planlı hale getirir."}
        </Text>
      </KeyboardAvoidingView>
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

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: semantic.screenSurface,
    borderWidth: 1,
    borderColor: semantic.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  titleBlock: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -0.3,
  },
  screenSub: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: font.regular,
    color: semantic.textSecondary,
  },
  sparkleBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
  },

  // Chat
  chatArea: {
    flex: 1,
  },
  chatContent: {
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },

  // Empty state
  emptyState: {
    borderRadius: radius.lg,
    borderWidth: 1,
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
    letterSpacing: -0.2,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    textAlign: "center",
  },

  // Messages
  messageWrap: {
    gap: spacing.xs,
  },
  userMessageWrap: {
    alignItems: "flex-end",
  },
  assistantMessageWrap: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "86%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    borderTopRightRadius: 6,
    backgroundColor: semantic.heroStart,
  },
  assistantBubble: {
    borderTopLeftRadius: 6,
    backgroundColor: semantic.screenSurface,
    borderWidth: 1,
    borderColor: semantic.border,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: font.regular,
  },
  userText: {
    color: semantic.textOnDark,
  },
  assistantText: {
    color: semantic.textPrimary,
  },

  // Suggestion card
  suggestionCard: {
    width: "90%",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: semantic.border,
    backgroundColor: semantic.screenSurface,
    padding: spacing.md,
    ...shadow.card,
  },
  suggestionTitle: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textSecondary,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  suggestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: semantic.border,
  },
  suggestionLabel: {
    fontSize: 13,
    fontFamily: font.regular,
    color: semantic.textSecondary,
  },
  suggestionValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    fontFamily: font.semiBold,
    fontWeight: "600",
    color: semantic.textPrimary,
  },
  suggestionActions: {
    marginTop: spacing.sm,
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
  },
  secondaryAction: {
    borderRadius: radius.pill,
    backgroundColor: semantic.appBackground,
    borderWidth: 1,
    borderColor: semantic.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  secondaryActionText: {
    fontSize: 12,
    fontFamily: font.semiBold,
    fontWeight: "600",
    color: semantic.textPrimary,
  },
  ghostAction: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ghostActionText: {
    fontSize: 12,
    fontFamily: font.regular,
    color: semantic.textSecondary,
  },
  primaryAction: {
    marginLeft: "auto",
    borderRadius: radius.pill,
    backgroundColor: semantic.heroStart,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  primaryActionText: {
    fontSize: 13,
    fontFamily: font.bold,
    fontWeight: "700",
    color: semantic.textOnDark,
  },

  // Chips
  chipsRow: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  chipsContent: {
    gap: spacing.xs,
    paddingRight: spacing.xs,
  },
  chip: {
    borderRadius: radius.pill,
    backgroundColor: semantic.screenSurface,
    borderWidth: 1,
    borderColor: semantic.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipPressed: {
    backgroundColor: semantic.appBackground,
  },
  chipText: {
    fontSize: 13,
    fontFamily: font.semiBold,
    fontWeight: "600",
    color: semantic.textPrimary,
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  voiceButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceButtonActive: {
    backgroundColor: semantic.accentSoft,
    borderWidth: 2,
    borderColor: semantic.accent,
  },
  inputWrap: {
    flex: 1,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: semantic.border,
    backgroundColor: semantic.screenSurface,
    paddingHorizontal: spacing.md,
  },
  input: {
    height: 46,
    fontSize: 14,
    fontFamily: font.regular,
    color: semantic.textPrimary,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: semantic.border,
  },

  // Footer
  footerHint: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    fontSize: 11,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    textAlign: "center",
  },
});
