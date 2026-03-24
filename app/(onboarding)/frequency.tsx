import { router } from "expo-router";
import { CalendarBlank, CalendarCheck, CalendarX } from "phosphor-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSessionStore } from "@state/useSessionStore";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

const options = [
  { value: "daily", title: "Her gün", sub: "Günlük görsel üretimi", Icon: CalendarCheck },
  { value: "every3days", title: "3 günde bir", sub: "Haftada 2-3 görsel", Icon: CalendarBlank },
  { value: "weekly", title: "Haftalık", sub: "Haftada 1 görsel", Icon: CalendarX },
] as const;

export default function FrequencyScreen() {
  const { generationFrequency, setGenerationFrequency } = useSessionStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ne sıklıkla
görsel üretelim?</Text>
      <Text style={styles.sub}>Bu ayarı profil bölümünden dilediğiniz zaman değiştirebilirsiniz.</Text>

      <View style={styles.list}>
        {options.map((option) => {
          const selected = generationFrequency === option.value;
          return (
            <TouchableOpacity key={option.value} style={[styles.row, selected && styles.rowSelected]} onPress={() => setGenerationFrequency(option.value)} activeOpacity={0.82}>
              <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}><option.Icon size={20} color={selected ? semantic.textOnDark : semantic.textSecondary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, selected && styles.rowTitleSelected]}>{option.title}</Text>
                <Text style={styles.rowSub}>{option.sub}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={[styles.button, shadow.soft]} onPress={() => router.push("/(onboarding)/notifications")}>
        <Text style={styles.buttonText}>Devam Et</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: semantic.appBackground, paddingHorizontal: spacing.xl, paddingTop: 74, paddingBottom: 50 },
  title: { fontSize: 38, lineHeight: 42, fontWeight: "700", color: semantic.textPrimary, letterSpacing: -0.8 },
  sub: { marginTop: spacing.xs, fontSize: 15, color: semantic.textSecondary, lineHeight: 22 },
  list: { marginTop: spacing.lg, gap: spacing.sm },
  row: { borderRadius: radius.lg, borderWidth: 1, borderColor: semantic.border, padding: spacing.md, backgroundColor: semantic.screenSurface, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowSelected: { borderColor: semantic.heroStart, backgroundColor: semantic.accentSoft },
  iconWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  iconWrapSelected: { backgroundColor: semantic.heroStart },
  rowTitle: { fontSize: 16, fontWeight: "700", color: semantic.textPrimary },
  rowTitleSelected: { color: semantic.heroStart },
  rowSub: { marginTop: 2, fontSize: 13, color: semantic.textSecondary },
  button: { marginTop: "auto", borderRadius: radius.lg, backgroundColor: semantic.heroStart, alignItems: "center", paddingVertical: 17 },
  buttonText: { color: semantic.textOnDark, fontSize: 16, fontWeight: "700" },
});
