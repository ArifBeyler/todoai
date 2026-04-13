import { StyleSheet, Text, View } from "react-native";
import { font, radius, semantic, spacing } from "@/src/ui/tokens";

type ReviewBadgeProps = {
  label: string;
  accessibilityLabel?: string;
};

export const ReviewBadge = ({ label, accessibilityLabel }: ReviewBadgeProps) => (
  <View
    style={styles.wrap}
    accessibilityRole="text"
    accessibilityLabel={accessibilityLabel ?? label}
  >
    <Text style={styles.text}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 2,
    borderRadius: radius.sm,
    backgroundColor: semantic.appBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
  },
  text: {
    fontSize: 12,
    fontFamily: font.medium,
    fontWeight: "500",
    color: semantic.textPrimary,
    letterSpacing: -0.1,
  },
});
