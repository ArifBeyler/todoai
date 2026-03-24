import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Check } from "phosphor-react-native";
import { useSessionStore } from "@state/useSessionStore";
import { VISUAL_STYLES } from "@/src/constants/styles";
import { palette, radius, semantic, shadow, spacing } from "@/src/ui/tokens";

const styleColors: Record<string, string> = {
  illustration: palette.steelTeal,
  watercolor: palette.dolphinGray,
  anime: palette.copperRed,
  minimal: palette.lightFrenchBeige,
  comic: palette.milkChocolate,
  pixel: palette.steelTeal,
};

export default function StyleScreen() {
  const { stylePreference, setStylePreference } = useSessionStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tarzınızı seçin</Text>
      <Text style={styles.sub}>Üretilecek tüm görseller seçtiğiniz estetikte olacak.</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
        {VISUAL_STYLES.map((item) => {
          const isSelected = stylePreference === item.value;
          const color = styleColors[item.value] ?? semantic.heroStart;
          return (
            <TouchableOpacity key={item.value} style={[styles.card, { backgroundColor: color }, isSelected && styles.cardSelected]} onPress={() => setStylePreference(item.value)} activeOpacity={0.82}>
              {isSelected ? <View style={styles.check}><Check size={12} color={semantic.textOnDark} weight="bold" /></View> : null}
              <Text style={styles.cardLabel}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={[styles.button, shadow.soft]} onPress={() => router.push("/(onboarding)/frequency")}>
        <Text style={styles.buttonText}>Devam Et</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: semantic.appBackground, paddingHorizontal: spacing.xl, paddingTop: 74, paddingBottom: 50 },
  title: { fontSize: 36, lineHeight: 40, fontWeight: "700", color: semantic.textPrimary, letterSpacing: -0.7 },
  sub: { marginTop: spacing.xs, fontSize: 15, color: semantic.textSecondary },
  grid: { marginTop: spacing.lg, flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingBottom: spacing.lg },
  card: { width: "47%", height: 112, borderRadius: radius.lg, justifyContent: "flex-end", padding: spacing.sm },
  cardSelected: { borderWidth: 2, borderColor: semantic.textOnDark },
  check: { position: "absolute", top: spacing.sm, right: spacing.sm, width: 22, height: 22, borderRadius: 11, backgroundColor: palette.milkChocolate, alignItems: "center", justifyContent: "center" },
  cardLabel: { color: semantic.textOnDark, fontSize: 14, fontWeight: "700" },
  button: { marginTop: "auto", borderRadius: radius.lg, backgroundColor: semantic.heroStart, alignItems: "center", paddingVertical: 17 },
  buttonText: { color: semantic.textOnDark, fontSize: 16, fontWeight: "700" },
});
