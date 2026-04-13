import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { spacing } from "@/src/ui/tokens";
import {
  BounceTouchable,
  ICON_OPTIONS,
  LAYER,
  SELECTABLE_SHADOW,
  type IconName,
  renderIcon,
} from "./composerShared";

type IconPickerRowProps = {
  selectedIndex: number;
  onSelect: (index: number) => void;
  visibleCount: number;
  onShowAll: () => void;
};

export const IconPickerRow = ({
  selectedIndex,
  onSelect,
  visibleCount,
  onShowAll,
}: IconPickerRowProps) => {
  const showAllVisible = visibleCount < ICON_OPTIONS.length;
  const visible = ICON_OPTIONS.slice(0, visibleCount);

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>İkon</Text>
        {showAllVisible && (
          <TouchableOpacity
            onPress={onShowAll}
            accessibilityRole="button"
            accessibilityLabel="Tüm ikonları gör"
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
        {visible.map((item, index) => {
          const selected = index === selectedIndex;
          return (
            <BounceTouchable
              key={item.icon}
              style={[styles.chip, selected && styles.chipActive]}
              onPress={() => onSelect(index)}
              accessibilityRole="button"
              accessibilityLabel={`${item.label} ikonu`}
              accessibilityState={{ selected }}
            >
              {renderIcon(
                item.icon,
                selected ? "#111111" : "rgba(17, 17, 17, 0.55)",
                20,
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
    gap: spacing.xs,
    paddingVertical: 2,
  },
  chip: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
    alignItems: "center",
    justifyContent: "center",
    ...SELECTABLE_SHADOW,
  },
  chipActive: {
    backgroundColor: LAYER.selectedFill,
    borderColor: LAYER.borderSelected,
  },
});
