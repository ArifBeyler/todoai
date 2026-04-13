import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp, FadeOut } from "react-native-reanimated";
import { Sparkle, Plus, X } from "phosphor-react-native";
import { radius, semantic, spacing } from "@/src/ui/tokens";
import { supabase } from "@/src/services/supabase";
import { useTodoStore } from "@/src/state/useTodoStore";

type Suggestion = {
  id: string;
  title: string;
  category: string;
  reason: string;
};

type AISuggestionCardProps = {
  onAccepted?: () => void;
};

export const AISuggestionCard = ({ onAccepted }: AISuggestionCardProps) => {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const addTodo = useTodoStore((s) => s.addTodo);

  useEffect(() => {
    loadSuggestion();
  }, []);

  const loadSuggestion = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("ai_suggestions")
        .select("id, suggestion_payload, reason_text")
        .eq("user_id", session.user.id)
        .is("accepted", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.suggestion_payload) {
        const payload = data.suggestion_payload as { title?: string; category?: string };
        setSuggestion({
          id: data.id,
          title: payload.title ?? "",
          category: payload.category ?? "other",
          reason: data.reason_text ?? "",
        });
      }
    } catch {}
  };

  const handleAccept = useCallback(async () => {
    if (!suggestion) return;

    addTodo({
      title: suggestion.title,
      category: suggestion.category,
      priority: "medium",
      recurrence: "once",
    });

    try {
      await supabase
        .from("ai_suggestions")
        .update({ accepted: true })
        .eq("id", suggestion.id);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.functions.invoke("track-event", {
          body: {
            eventName: "ai_suggestion_accepted",
            properties: { suggestionId: suggestion.id, category: suggestion.category },
          },
        });
      }
    } catch {}

    setSuggestion(null);
    onAccepted?.();
  }, [suggestion, addTodo, onAccepted]);

  const handleDismiss = useCallback(async () => {
    if (!suggestion) return;

    try {
      await supabase
        .from("ai_suggestions")
        .update({ accepted: false, dismissed_count: 1 })
        .eq("id", suggestion.id);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.functions.invoke("track-event", {
          body: {
            eventName: "ai_suggestion_dismissed",
            properties: { suggestionId: suggestion.id },
          },
        });
      }
    } catch {}

    setDismissed(true);
    setTimeout(() => setSuggestion(null), 300);
  }, [suggestion]);

  if (!suggestion || dismissed) return null;

  return (
    <Animated.View
      entering={FadeInUp.delay(300).duration(500).springify()}
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      <View style={styles.header}>
        <Sparkle size={18} color={semantic.accent} weight="fill" />
        <Text style={styles.headerText}>AI Önerisi</Text>
      </View>

      <Text style={styles.title}>{suggestion.title}</Text>

      {suggestion.reason ? (
        <Text style={styles.reason}>{suggestion.reason}</Text>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleAccept}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Öneriyi ekle"
        >
          <Plus size={16} color="#FFFFFF" weight="bold" />
          <Text style={styles.acceptText}>Ekle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Öneriyi kapat"
        >
          <X size={16} color="#8A7A70" weight="regular" />
          <Text style={styles.dismissText}>Şimdi değil</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    backgroundColor: "#FFF8F5",
    borderWidth: 1,
    borderColor: "#FFE8E0",
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "700",
    color: semantic.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#3A2E28",
    lineHeight: 24,
  },
  reason: {
    fontSize: 13,
    color: "#8A7A70",
    fontWeight: "500",
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: semantic.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  acceptText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  dismissButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dismissText: {
    color: "#8A7A70",
    fontSize: 14,
    fontWeight: "600",
  },
});
