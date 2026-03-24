import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CheckSquare } from "phosphor-react-native";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

export default function FeatureOneScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.steps}><View style={[styles.dot, styles.dotActive]} /><View style={styles.dot} /></View>
      <View style={[styles.iconWrap, shadow.card]}><CheckSquare size={42} color={semantic.heroStart} weight="fill" /></View>
      <Text style={styles.title}>Görevlerinizi düzenleyin</Text>
      <Text style={styles.description}>Ev işleri, spor ve günlük hedefleriniz tek panelde sade bir akışla toplansın.</Text>
      <TouchableOpacity style={[styles.button, shadow.soft]} onPress={() => router.push("/(onboarding)/feature-two")} activeOpacity={0.85}>
        <Text style={styles.buttonText}>Devam Et</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: semantic.appBackground, paddingHorizontal: spacing.xl, paddingTop: 74, paddingBottom: 50 },
  steps: { flexDirection: "row", gap: 6, marginBottom: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: semantic.border },
  dotActive: { width: 24, backgroundColor: semantic.heroStart },
  iconWrap: { width: 82, height: 82, borderRadius: radius.lg, backgroundColor: semantic.screenSurface, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  title: { fontSize: 38, lineHeight: 40, fontWeight: "700", color: semantic.textPrimary, letterSpacing: -0.8 },
  description: { marginTop: spacing.sm, fontSize: 17, lineHeight: 24, color: semantic.textSecondary, maxWidth: "94%" },
  button: { marginTop: "auto", borderRadius: radius.lg, backgroundColor: semantic.heroStart, alignItems: "center", paddingVertical: 17 },
  buttonText: { color: semantic.textOnDark, fontSize: 16, fontWeight: "700" },
});
