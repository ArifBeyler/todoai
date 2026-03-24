import { StyleSheet, Text, View } from "react-native";
import type { ComponentType } from "react";
import { radius, spacing } from "@/src/ui/tokens";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: ComponentType<{ size: number; color: string; weight: string }>;
  color?: string;
};

export const StatCard = ({ label, value, icon: Icon, color = "#3A2E28" }: StatCardProps) => {
  return (
    <View style={styles.card}>
      {Icon ? (
        <View style={[styles.iconWrap, { backgroundColor: `${color}14` }]}>
          <Icon size={18} color={color} weight="fill" />
        </View>
      ) : null}
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#F2EEE8",
    paddingVertical: 12,
    alignItems: "center",
    gap: 2,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxs,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
  },
  label: {
    fontSize: 11,
    color: "#7C6C62",
    fontWeight: "500",
  },
});
