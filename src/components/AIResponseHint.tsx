import { StyleSheet, Text, View } from "react-native";
import { font, semantic, spacing } from "@/src/ui/tokens";

type AIResponseHintProps = {
  text: string;
};

export const AIResponseHint = ({ text }: AIResponseHintProps) => (
  <View style={styles.wrap} accessibilityRole="text">
    <Text style={styles.text}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    maxWidth: "92%",
    paddingVertical: spacing.xxs,
    paddingHorizontal: 0,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: font.medium,
    fontWeight: "500",
    color: semantic.textSecondary,
    letterSpacing: -0.15,
  },
});
