import { useCallback } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Check, CircleDashed } from "phosphor-react-native";
import { resolveTodoIcon } from "@/src/utils/resolveTodoIcon";
import { radius, semantic, spacing } from "@/src/ui/tokens";
import type { TodoItemModel } from "@/src/state/useTodoStore";

type TodoSelectorProps = {
  todos: TodoItemModel[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll?: () => void;
};

export const TodoSelector = ({
  todos,
  selectedIds,
  onToggle,
  onSelectAll,
}: TodoSelectorProps) => {
  const renderItem = useCallback(
    ({ item, index }: { item: TodoItemModel; index: number }) => {
      const isSelected = selectedIds.includes(item.id);
      const { Icon, color } = resolveTodoIcon(item.title, item.category);

      return (
        <Animated.View entering={FadeIn.delay(index * 50).duration(200)}>
          <TouchableOpacity
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onToggle(item.id)}
            activeOpacity={0.8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={item.title}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
              {isSelected ? (
                <Check size={14} color={semantic.textOnDark} weight="bold" />
              ) : (
                <Icon size={14} color={color} weight="regular" />
              )}
            </View>
            <Text
              style={[styles.chipText, isSelected && styles.chipTextSelected]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [selectedIds, onToggle],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Görevler</Text>
        {onSelectAll && todos.length > 0 && todos.length <= 5 && (
          <TouchableOpacity onPress={onSelectAll} accessibilityRole="button">
            <Text style={styles.selectAllText}>Tümünü Seç</Text>
          </TouchableOpacity>
        )}
      </View>
      {todos.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <CircleDashed size={18} color="rgba(17,17,17,0.28)" weight="regular" />
          </View>
          <Text style={styles.emptyText}>Henüz aktif görev yok</Text>
          <Text style={styles.emptyHint}>Ana sayfadan görev ekleyebilirsin</Text>
        </View>
      ) : (
        <FlatList
          data={todos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(17,17,17,0.38)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: semantic.accent,
  },
  listContent: {
    paddingVertical: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: "#EDEBE7",
    maxWidth: 200,
  },
  chipSelected: {
    backgroundColor: "#111111",
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
    flexShrink: 1,
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  emptyState: {
    paddingVertical: 22,
    alignItems: "center",
    gap: 5,
  },
  emptyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "rgba(17,17,17,0.52)",
    fontWeight: "500",
  },
  emptyHint: {
    fontSize: 12,
    color: "rgba(17,17,17,0.32)",
    fontWeight: "400",
  },
});
