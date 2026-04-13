import { useCallback } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Check } from "phosphor-react-native";
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
          <Text style={styles.emptyText}>Bugün için aktif görev yok</Text>
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
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8A7A70",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: semantic.accent,
  },
  listContent: {
    paddingVertical: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: "#F2EEE8",
    maxWidth: 200,
  },
  chipSelected: {
    backgroundColor: "#111111",
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3A2E28",
    flexShrink: 1,
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  emptyState: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#8A7A70",
    fontWeight: "500",
  },
});
