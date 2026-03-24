import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSessionStore } from "@state/useSessionStore";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

export default function NameScreen() {
  const [name, setName] = useState("");
  const { setProfileName } = useSessionStore();

  const handleContinue = () => {
    if (!name.trim()) return;
    setProfileName(name.trim());
    router.push("/(onboarding)/complete");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{"Size nasıl\nhitap edelim?"}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Adınızı yazın"
          placeholderTextColor={semantic.textSecondary}
          autoFocus
          style={styles.input}
          accessibilityLabel="Adınız"
        />
        <TouchableOpacity
          style={[styles.button, !name.trim() && styles.disabled, shadow.soft]}
          onPress={handleContinue}
          disabled={!name.trim()}
          accessibilityRole="button"
          accessibilityLabel="Devam et"
        >
          <Text style={styles.buttonText}>Devam Et</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.appBackground,
    paddingHorizontal: spacing.xl,
    paddingTop: 94,
    paddingBottom: 50,
  },
  title: {
    fontSize: 44,
    lineHeight: 46,
    fontWeight: "700",
    color: semantic.textPrimary,
    letterSpacing: -0.8,
  },
  input: {
    marginTop: 40,
    borderBottomWidth: 2,
    borderBottomColor: semantic.heroStart,
    paddingVertical: 10,
    fontSize: 22,
    color: semantic.textPrimary,
    fontWeight: "600",
  },
  button: {
    marginTop: "auto",
    borderRadius: radius.lg,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    paddingVertical: 17,
  },
  buttonText: {
    color: semantic.textOnDark,
    fontSize: 16,
    fontWeight: "700",
  },
  disabled: { opacity: 0.5 },
});
