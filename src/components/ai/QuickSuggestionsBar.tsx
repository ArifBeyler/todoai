import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const QUICK_SUGGESTIONS = [
  "Bugün için görev ekle",
  "Yarın sabah spor yap",
  "Her gün meditasyon",
  "Haftalık plan yap",
];

type QuickSuggestionsBarProps = {
  onSelect: (suggestion: string) => void;
};

export const QuickSuggestionsBar = ({ onSelect }: QuickSuggestionsBarProps) => (
  <View style={styles.chipsSection}>
    <Text style={styles.chipsSectionLabel}>Şunu dene</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsScrollContent}
      style={styles.chipsScroll}
    >
      {QUICK_SUGGESTIONS.map((item) => (
        <Pressable
          key={item}
          style={({ pressed }) => [styles.chipPill, pressed && styles.chipPillPressed]}
          onPress={() => onSelect(item)}
          accessibilityRole="button"
          accessibilityLabel={item}
        >
          <Text style={styles.chipPillText} numberOfLines={1}>
            {item}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  chipsSection: {
    paddingBottom: 6,
    gap: 8,
  },
  chipsSectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#AAA",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsScrollContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  chipPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F4F1EC",
    borderWidth: 1,
    borderColor: "#E5DDD5",
  },
  chipPillPressed: {
    opacity: 0.75,
  },
  chipPillText: {
    fontSize: 13,
    color: "#3A2E28",
    fontWeight: "500",
  },
});
