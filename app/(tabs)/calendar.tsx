import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "phosphor-react-native";
import { useTodoStore } from "@state/useTodoStore";
import type { TodoItemModel } from "@state/useTodoStore";
import { TaskCard } from "@/src/components/TaskCard";
import { useTodoVisualGeneration } from "@/src/hooks/useTodoVisualGeneration";

type WeekDay = {
  id: string;
  dayNumber: number;
  date: Date;
  shortLabel: string;
  fullLabel: string;
};

const DAY_NAMES_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const DAY_NAMES_FULL = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const getWeekDays = (): WeekDay[] => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const jsDay = date.getDay();
    return {
      id: `day-${i}`,
      dayNumber: date.getDate(),
      date,
      shortLabel: DAY_NAMES_SHORT[jsDay],
      fullLabel: DAY_NAMES_FULL[jsDay],
    };
  });
};

const toDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const shouldShowOnDay = (todo: TodoItemModel, day: WeekDay): boolean => {
  const jsDay = day.date.getDay();
  const dateKey = toDateKey(day.date);

  switch (todo.recurrence) {
    case "daily":
      return true;
    case "weekdays":
      return jsDay >= 1 && jsDay <= 5;
    case "weekend":
      return jsDay === 0 || jsDay === 6;
    case "weekly": {
      const created = new Date(todo.createdAt);
      return created.getDay() === jsDay;
    }
    case "custom":
      return todo.customDates?.includes(dateKey) ?? false;
    case "once":
    default:
      return true;
  }
};

export default function CalendarScreen() {
  const weekDays = useMemo(getWeekDays, []);
  const today = new Date();
  const todayDayNumber = today.getDate();

  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const idx = weekDays.findIndex((d) => d.dayNumber === todayDayNumber);
    return idx >= 0 ? idx : 0;
  });

  const { todos, toggleTodo } = useTodoStore();
  const { handleTodoCompleted } = useTodoVisualGeneration();
  const selectedDay = weekDays[selectedDayIndex];

  const dayAbbrev = selectedDay.fullLabel.slice(0, 3);
  const dateString = `${selectedDay.dayNumber} ${MONTH_NAMES[today.getMonth()]}\n${today.getFullYear()}`;

  const filteredTodos = useMemo(
    () =>
      todos.filter(
        (t) => t.deletedAt == null && !t.isCompleted && shouldShowOnDay(t, selectedDay),
      ),
    [todos, selectedDay],
  );

  const handleToggleTodo = useCallback(
    (id: string) => {
      const todo = todos.find((t) => t.id === id);
      const isCompleting = todo && !todo.isCompleted;
      toggleTodo(id);
      if (isCompleting) {
        handleTodoCompleted(id);
      }
    },
    [todos, toggleTodo, handleTodoCompleted],
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.dayNameRow}>
            <Text style={styles.dayName}>{dayAbbrev}</Text>
            <View style={styles.todayDot} />
          </View>
          <Text style={styles.dateText}>{dateString}</Text>
        </View>

        <View style={styles.weekStrip}>
          {weekDays.map((day, index) => {
            const isSelected = index === selectedDayIndex;
            return (
              <TouchableOpacity
                key={day.id}
                style={[styles.weekCell, isSelected && styles.weekCellSelected]}
                onPress={() => setSelectedDayIndex(index)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.weekCellNumber, isSelected && styles.weekCellNumberSelected]}>
                  {day.dayNumber}
                </Text>
                <Text style={[styles.weekCellLabel, isSelected && styles.weekCellLabelSelected]}>
                  {day.shortLabel.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.divider} />

        <View style={styles.taskList}>
          {filteredTodos.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <Plus size={18} color="rgba(17,17,17,0.3)" weight="bold" />
              </View>
              <Text style={styles.emptyTitle}>Bu gün için görev yok</Text>
              <Text style={styles.emptyDesc}>
                Yeni bir görev ekleyerek planına başla.
              </Text>
            </View>
          ) : (
            filteredTodos.map((task) => (
              <TaskCard
                key={task.id}
                title={task.title}
                category={task.category}
                priority={task.priority}
                isCompleted={task.isCompleted}
                recurrence={task.recurrence}
                onToggle={() => handleToggleTodo(task.id)}
                onPress={() => router.push(`/todo/${task.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 120,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  dayNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayName: {
    fontSize: 38,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -1,
  },
  todayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E04B3A",
    marginTop: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#999999",
    textAlign: "right",
    lineHeight: 22,
    marginTop: 6,
  },

  weekStrip: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 4,
    gap: 0,
  },
  weekCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  weekCellSelected: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  weekCellNumber: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  weekCellNumberSelected: {
    fontWeight: "700",
  },
  weekCellLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "600",
    color: "#AAAAAA",
    letterSpacing: 0.3,
  },
  weekCellLabelSelected: {
    color: "#666666",
  },

  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 20,
    marginVertical: 8,
  },

  taskList: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  emptyWrap: {
    paddingTop: 40,
    alignItems: "center",
    gap: 6,
  },
  emptyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  emptyDesc: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
  },
});
