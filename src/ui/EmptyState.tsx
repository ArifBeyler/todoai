import { StyleSheet, Text, View } from "react-native";
import type { ComponentType } from "react";
import { radius, spacing } from "@/src/ui/tokens";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ComponentType<{ size: number; color: string; weight: string }>;
};

export const EmptyState = ({ title, description, icon: Icon }: EmptyStateProps) => (
  <View style={styles.container}>
    {Icon ? (
      <View style={styles.iconWrap}>
        <Icon size={24} color="#8A7A70" weight="regular" />
      </View>
    ) : null}
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E2D8CD",
    borderStyle: "dashed",
    backgroundColor: "#FDFAF6",
    paddingVertical: 24,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    gap: 4,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F2EEE8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "600",
    color: "#3A2E28",
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: "#8A7A70",
    textAlign: "center",
  },
});
