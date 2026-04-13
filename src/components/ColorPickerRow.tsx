import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { spacing } from "@/src/ui/tokens";
import {
  BounceTouchable,
  COLOR_OPTIONS,
  LAYER,
  type ColorOption,
} from "./composerShared";

type ColorPickerRowProps = {
  selectedColor: ColorOption;
  onSelect: (color: ColorOption) => void;
  visibleCount: number;
  onShowAll: () => void;
};

export const ColorPickerRow = ({
  selectedColor,
  onSelect,
  visibleCount,
  onShowAll,
}: ColorPickerRowProps) => {
  const showAllVisible = visibleCount < COLOR_OPTIONS.length;
  const visible = COLOR_OPTIONS.slice(0, visibleCount);

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Renk</Text>
        {showAllVisible && (
          <TouchableOpacity
            onPress={onShowAll}
            accessibilityRole="button"
            accessibilityLabel="Tüm renkleri gör"
          >
            <Text style={styles.viewAll}>Tümünü Gör</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {visible.map((item) => {
          const selected = selectedColor === item;
          return (
            <BounceTouchable
              key={item}
              style={[styles.swatchWrap, selected && styles.swatchWrapActive]}
              onPress={() => onSelect(item)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={item === "rainbow" ? "Özel renk" : `Renk ${item}`}
            >
              {item === "rainbow" ? (
                <LinearGradient
                  colors={["#ff7a7a", "#ffd48c", "#8ecfb0", "#88b6f0", "#d4a9e5"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.swatch}
                />
              ) : (
                <View style={[styles.swatch, { backgroundColor: item }]} />
              )}
            </BounceTouchable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.1,
  },
  viewAll: {
    fontSize: 13,
    color: "rgba(17, 17, 17, 0.45)",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 2,
  },
  swatchWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchWrapActive: {
    borderColor: "rgba(17, 17, 17, 0.18)",
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});
