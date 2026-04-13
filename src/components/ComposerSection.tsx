import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LAYER } from "./composerShared";
import { spacing } from "@/src/ui/tokens";

type ComposerSectionProps = {
  title?: string;
  showDivider?: boolean;
  children: ReactNode;
};

export const ComposerSection = ({
  title,
  showDivider = true,
  children,
}: ComposerSectionProps) => (
  <View style={styles.root}>
    {showDivider && <View style={styles.divider} />}
    {title ? <Text style={styles.title}>{title}</Text> : null}
    {children}
  </View>
);

const styles = StyleSheet.create({
  root: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LAYER.border,
    marginBottom: 2,
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(17, 17, 17, 0.36)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingLeft: 2,
  },
});
