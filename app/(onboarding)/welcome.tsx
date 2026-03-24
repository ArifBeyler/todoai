import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { palette, radius, semantic, shadow, spacing } from "@/src/ui/tokens";

export default function WelcomeScreen() {
  return (
    <LinearGradient colors={[palette.lightFrenchBeige, palette.copperRed]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <View style={styles.logoDot} />
      <View style={styles.hero}>
        <Text style={styles.headline}>Gününüzü
sanata dönüştürün.</Text>
        <Text style={styles.description}>Yapılacak görevlerinizi ekleyin, yapay zekâ sizi pastel bir hikâyede canlandırsın.</Text>
      </View>
      <TouchableOpacity style={[styles.cta, shadow.soft]} onPress={() => router.push("/(onboarding)/feature-one")} activeOpacity={0.85}>
        <Text style={styles.ctaText}>Başlayalım</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: 74, paddingBottom: 52 },
  logoDot: { width: 44, height: 44, borderRadius: 22, backgroundColor: semantic.textOnDark },
  hero: { flex: 1, justifyContent: "center", gap: spacing.md },
  headline: { fontSize: 48, lineHeight: 50, fontWeight: "700", color: semantic.textOnDark, letterSpacing: -1 },
  description: { fontSize: 17, lineHeight: 24, color: "rgba(255,248,238,0.95)", maxWidth: "94%" },
  cta: { borderRadius: radius.lg, paddingVertical: 18, alignItems: "center", backgroundColor: semantic.textOnDark },
  ctaText: { color: semantic.textPrimary, fontSize: 16, fontWeight: "700" },
});
