import { router } from "expo-router";
import { CaretLeft } from "phosphor-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { radius, spacing } from "@/src/ui/tokens";

export const STATS_LAYER = {
  bg: "#F2F2F0",
  card: "#FAFAF9",
  inset: "#EDEDEB",
  border: "rgba(0, 0, 0, 0.04)",
  borderStrong: "rgba(0, 0, 0, 0.08)",
} as const;

export const STATS_CARD_SHADOW = {
  shadowColor: "rgba(0, 0, 0, 0.06)",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 1,
  shadowRadius: 24,
  elevation: 6,
} as const;

export const STATS_RAISED_ITEM_SHADOW = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
} as const;

type StatsHeaderProps = {
  title: string;
  subtitle?: string;
};

export const StatsHeader = ({ title, subtitle }: StatsHeaderProps) => (
  <View style={styles.wrap}>
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => router.back()}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel="Geri dön"
    >
      <CaretLeft size={16} color="#111111" weight="bold" />
      <Text style={styles.backText}>Geri</Text>
    </TouchableOpacity>
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: STATS_LAYER.inset,
    borderWidth: 1,
    borderColor: STATS_LAYER.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: spacing.sm,
  },
  backText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111111",
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(17, 17, 17, 0.55)",
  },
});
