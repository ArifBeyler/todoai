import { useMemo, useState } from "react";
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
import { ArrowLeft, Microphone, PaperPlaneTilt, PencilSimple, Sparkle, X } from "phosphor-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { radius, shadow, spacing } from "@/src/ui/tokens";

type SuggestedTask = {
  title: string;
  category: string;
  dateTime: string;
  priority: "Dusuk" | "Orta" | "Yuksek";
};

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  taskSuggestion?: SuggestedTask;
};

const QUICK_SUGGESTIONS = [
  "Bugun icin gorev ekle",
  "Haftalik plan yap",
  "Aliskanlik olustur",
  "Yarin icin hatirlatici ekle",
];

const VOICE_SAMPLE = "Yarin sabah spor yapmayi hatirlat";

const randomId = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const inferMockTask = (source: string): SuggestedTask => {
  const normalized = source.toLowerCase();
  const title = source.trim() || "Yeni gorev";

  let category = "personal";
  if (normalized.includes("spor") || normalized.includes("yuruyus")) category = "health";
  if (normalized.includes("market") || normalized.includes("alisveris")) category = "errands";
  if (normalized.includes("is") || normalized.includes("toplanti")) category = "work";
  if (normalized.includes("ders") || normalized.includes("ogren")) category = "learning";

  let dateTime = "Bugun, 18:00";
  if (normalized.includes("yarin")) dateTime = "Yarin, 09:00";
  if (normalized.includes("hafta")) dateTime = "Bu hafta, tekrarlayan";
  if (normalized.includes("sabah")) dateTime = "Yarin, 08:00";

  let priority: SuggestedTask["priority"] = "Orta";
  if (normalized.includes("acil") || normalized.includes("onemli")) priority = "Yuksek";
  if (normalized.includes("hatirlat")) priority = "Dusuk";

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    category: category.charAt(0).toUpperCase() + category.slice(1),
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
}) => {
  return (
    <View style={styles.suggestionCard}>
      <Text style={styles.suggestionTitle}>Onerilen gorev</Text>
      <View style={styles.suggestionRow}>
        <Text style={styles.suggestionLabel}>Baslik</Text>
        <Text style={styles.suggestionValue}>{suggestion.title}</Text>
      </View>
      <View style={styles.suggestionRow}>
        <Text style={styles.suggestionLabel}>Kategori</Text>
        <Text style={styles.suggestionValue}>{suggestion.category}</Text>
      </View>
      <View style={styles.suggestionRow}>
        <Text style={styles.suggestionLabel}>Tarih/Saat</Text>
        <Text style={styles.suggestionValue}>{suggestion.dateTime}</Text>
      </View>
      <View style={styles.suggestionRow}>
        <Text style={styles.suggestionLabel}>Oncelik</Text>
        <Text style={styles.suggestionValue}>{suggestion.priority}</Text>
      </View>

      <View style={styles.suggestionActions}>
        <TouchableOpacity style={styles.secondaryAction} onPress={onEdit}>
          <PencilSimple size={14} color="#5C4F47" weight="bold" />
          <Text style={styles.secondaryActionText}>Duzenle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostAction} onPress={onCancel}>
          <X size={14} color="#8A7569" weight="bold" />
          <Text style={styles.ghostActionText}>Iptal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryAction} onPress={onApprove}>
          <Text style={styles.primaryActionText}>Onayla</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function AiAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = (value?: string) => {
    const text = (value ?? inputValue).trim();
    if (!text) return;

    const userMessage: Message = {
      id: randomId(),
      role: "user",
      text,
    };

    const suggestedTask = inferMockTask(text);
    const assistantMessage: Message = {
      id: randomId(),
      role: "assistant",
      text: "Anladim. Bunu gorev olarak su sekilde hazirladim:",
      taskSuggestion: suggestedTask,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInputValue("");
  };

  const handleSuggestionPress = (suggestion: string) => {
    handleSend(suggestion);
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

  const lastAssistantSuggestion = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "assistant" && messages[i].taskSuggestion) {
        return messages[i].taskSuggestion;
      }
    }
    return null;
  }, [messages]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#2E2520" weight="bold" />
          </TouchableOpacity>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>AI Task Assistant</Text>
            <Text style={styles.subtitle}>Gorevlerini konusarak veya yazarak yonet</Text>
          </View>
          <View style={styles.sparkleBadge}>
            <Sparkle size={15} color="#F7EFE5" weight="fill" />
          </View>
        </View>

        <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Sparkle size={20} color="#FAF6F0" weight="fill" />
              </View>
              <Text style={styles.emptyTitle}>Akilli asistanin hazir</Text>
              <Text style={styles.emptyText}>
                Dogal bir cumle yaz, sesinle konus veya hizli onerilerden birini sec. Gorevi senin icin net bir karta donustureyim.
              </Text>
            </View>
          ) : null}

          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrap,
                message.role === "user" ? styles.userMessageWrap : styles.assistantMessageWrap,
              ]}
            >
              <View style={[styles.messageBubble, message.role === "user" ? styles.userBubble : styles.assistantBubble]}>
                <Text style={[styles.messageText, message.role === "user" ? styles.userText : styles.assistantText]}>
                  {message.text}
                </Text>
              </View>

              {message.taskSuggestion ? (
                <TaskSuggestionCard
                  suggestion={message.taskSuggestion}
                  onApprove={() =>
                    setMessages((prev) => [
                      ...prev,
                      { id: randomId(), role: "assistant", text: "Harika, gorevi listene kaydetmeye haziriz (mock)." },
                    ])
                  }
                  onEdit={() => setInputValue(message.taskSuggestion?.title ?? "")}
                  onCancel={() =>
                    setMessages((prev) => [
                      ...prev,
                      { id: randomId(), role: "assistant", text: "Tamam, bu oneriyi iptal ettim. Yeni bir komut verebilirsin." },
                    ])
                  }
                />
              ) : null}
            </View>
          ))}
        </ScrollView>

        <View style={styles.suggestionsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsContent}>
            {QUICK_SUGGESTIONS.map((item) => (
              <Pressable key={item} style={styles.suggestionChip} onPress={() => handleSuggestionPress(item)}>
                <Text style={styles.suggestionChipText}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
            onPress={handleVoice}
            accessibilityRole="button"
            accessibilityLabel="Sesle gorev ekle"
          >
            <Microphone size={18} color={isRecording ? "#2B1D16" : "#FAF5EE"} weight="fill" />
          </TouchableOpacity>
          <View style={styles.inputWrap}>
            <TextInput
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Orn. Yarin sabah spor yapmayi hatirlat"
              placeholderTextColor="#9B8A7E"
              style={styles.input}
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
            />
          </View>
          <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()}>
            <PaperPlaneTilt size={17} color="#FFF7EE" weight="fill" />
          </TouchableOpacity>
        </View>

        {lastAssistantSuggestion ? (
          <Text style={styles.footerHint}>Son onerilen gorev: {lastAssistantSuggestion.title}</Text>
        ) : (
          <Text style={styles.footerHint}>Asistan gorevlerini daha net ve planli hale getirir.</Text>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F3EC",
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
  },
  topBar: {
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFE7DC",
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
    color: "#2E2520",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#7B6B60",
  },
  sparkleBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2C221C",
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    paddingBottom: 14,
    gap: 10,
  },
  emptyState: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E4D9CE",
    backgroundColor: "#FFFDF9",
    padding: spacing.lg,
    alignItems: "center",
    marginTop: 8,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2E2520",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#342A24",
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "#73645A",
    textAlign: "center",
  },
  messageWrap: {
    gap: 8,
  },
  userMessageWrap: {
    alignItems: "flex-end",
  },
  assistantMessageWrap: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "88%",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  userBubble: {
    borderTopRightRadius: 8,
    backgroundColor: "#2E2520",
  },
  assistantBubble: {
    borderTopLeftRadius: 8,
    backgroundColor: "#EEE6DB",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: "#FAF5EE",
  },
  assistantText: {
    color: "#44372F",
  },
  suggestionCard: {
    width: "92%",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E2D7CC",
    backgroundColor: "#FFFDF9",
    padding: spacing.md,
    ...shadow.card,
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4E4037",
    marginBottom: 10,
  },
  suggestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 7,
  },
  suggestionLabel: {
    fontSize: 12,
    color: "#85756A",
  },
  suggestionValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    color: "#3B2E27",
    fontWeight: "600",
  },
  suggestionActions: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  secondaryAction: {
    borderRadius: 999,
    backgroundColor: "#EFE5D8",
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  secondaryActionText: {
    fontSize: 12,
    color: "#5C4F47",
    fontWeight: "600",
  },
  ghostAction: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DFD1C2",
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ghostActionText: {
    fontSize: 12,
    color: "#847165",
    fontWeight: "600",
  },
  primaryAction: {
    marginLeft: "auto",
    borderRadius: 999,
    backgroundColor: "#2F251F",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  primaryActionText: {
    fontSize: 12,
    color: "#FAF4EC",
    fontWeight: "700",
  },
  suggestionsWrap: {
    marginTop: 6,
    marginBottom: 8,
  },
  suggestionsContent: {
    gap: 8,
    paddingRight: 14,
  },
  suggestionChip: {
    borderRadius: 999,
    backgroundColor: "#EEE5D8",
    borderWidth: 1,
    borderColor: "#E0D3C5",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionChipText: {
    fontSize: 12,
    color: "#5A4C43",
    fontWeight: "600",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#312722",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceButtonActive: {
    backgroundColor: "#EFD9C2",
  },
  inputWrap: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#DCCFC2",
    backgroundColor: "#FFFDF9",
    paddingHorizontal: 14,
  },
  input: {
    height: 44,
    fontSize: 14,
    color: "#392D27",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2D231E",
    alignItems: "center",
    justifyContent: "center",
  },
  footerHint: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 11,
    color: "#8C7C70",
    textAlign: "center",
  },
});
