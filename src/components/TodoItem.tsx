import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CheckCircle, CircleDashed } from "phosphor-react-native";
import type { TodoItemModel } from "@state/useTodoStore";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

type TodoItemProps = {
  item: TodoItemModel;
  onToggle: () => void;
  onPress: () => void;
};

const getPriorityColor = (priority: TodoItemModel["priority"]) => {
  if (priority === "high") return semantic.danger;
  if (priority === "medium") return semantic.accent;
  return semantic.success;
};

export const TodoItem = ({ item, onToggle, onPress }: TodoItemProps) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={styles.wrap}>
      <View style={[styles.card, shadow.card]}>
        <View style={[styles.priorityLine, { backgroundColor: getPriorityColor(item.priority) }]} />
        <View style={styles.content}>
          <Text numberOfLines={2} style={[styles.title, item.isCompleted && styles.titleDone]}>
            {item.title}
          </Text>
          <Text style={styles.meta}>{item.category} • {item.priority}</Text>
        </View>
        <TouchableOpacity onPress={onToggle} hitSlop={10}>
          {item.isCompleted ? (
            <CheckCircle size={26} color={semantic.success} weight="fill" />
          ) : (
            <CircleDashed size={26} color={semantic.textSecondary} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: semantic.cardSurface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
    gap: spacing.sm,
  },
  priorityLine: {
    width: 6,
    alignSelf: "stretch",
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  content: {
    flex: 1,
    paddingVertical: 2,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
    color: semantic.textPrimary,
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: semantic.textSecondary,
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: semantic.textSecondary,
    textTransform: "capitalize",
  },
});
