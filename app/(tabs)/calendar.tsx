import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle } from "phosphor-react-native";
import { useTodoStore } from "@state/useTodoStore";
import type { TodoItemModel } from "@state/useTodoStore";
import { radius, spacing } from "@/src/ui/tokens";
import { resolveTodoIcon } from "@/src/utils/resolveTodoIcon";

type WeekDay = {
  id: string;
  dayNumber: number;
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
      shortLabel: DAY_NAMES_SHORT[jsDay],
      fullLabel: DAY_NAMES_FULL[jsDay],
    };
  });
};

const getMockTime = (index: number): string | undefined => {
  const times = ["08:30", "09:00", "10:00", "13:00", undefined, undefined, "21:00"];
  return times[index % times.length];
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
  const selectedDay = weekDays[selectedDayIndex];

  const dayAbbrev = selectedDay.fullLabel.slice(0, 3);
  const dateString = `${selectedDay.dayNumber} ${MONTH_NAMES[today.getMonth()]}\n${today.getFullYear()}`;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header — large day name + date */}
        <View style={styles.header}>
          <View style={styles.dayNameRow}>
            <Text style={styles.dayName}>{dayAbbrev}</Text>
            <View style={styles.todayDot} />
          </View>
          <Text style={styles.dateText}>{dateString}</Text>
        </View>

        {/* Week strip */}
        <View style={styles.weekStrip}>
          {weekDays.map((day, index) => {
            const isSelected = index === selectedDayIndex;
            const isToday = day.dayNumber === todayDayNumber;
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

        {/* Divider */}
        <View style={styles.divider} />

        {/* Task list */}
        {todos.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Bugün için görev yok</Text>
            <Text style={styles.emptyDesc}>
              Yeni bir görev ekleyerek planına başla.
            </Text>
          </View>
        ) : (
          <View style={styles.taskList}>
            {todos.map((task, index) => (
              <TaskRow
                key={task.id}
                task={task}
                time={getMockTime(index)}
                isLast={index === todos.length - 1}
                onToggle={() => toggleTodo(task.id)}
                onPress={() => router.push(`/todo/${task.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const TaskRow = ({
  task,
  time,
  isLast,
  onToggle,
  onPress,
}: {
  task: TodoItemModel;
  time?: string;
  isLast: boolean;
  onToggle: () => void;
  onPress: () => void;
}) => {
  const resolved = resolveTodoIcon(task.title, task.category);
  const Icon = resolved.Icon;
  const iconColor = resolved.color;

  return (
    <TouchableOpacity
      style={[styles.taskRow, !isLast && styles.taskRowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <TouchableOpacity
        onPress={onToggle}
        hitSlop={10}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.isCompleted }}
        style={styles.iconArea}
      >
        {task.isCompleted ? (
          <CheckCircle size={22} color="#76A28A" weight="fill" />
        ) : (
          <Icon size={20} color={iconColor} weight="regular" />
        )}
      </TouchableOpacity>

      <Text
        style={[styles.taskTitle, task.isCompleted && styles.taskTitleDone]}
        numberOfLines={1}
      >
        {task.title}
      </Text>

      {time ? <Text style={styles.taskTime}>{time}</Text> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 120,
  },

  /* Header */
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

  /* Week strip */
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

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 20,
    marginVertical: 8,
  },

  /* Task list */
  taskList: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  taskRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  iconArea: {
    width: 32,
    alignItems: "center",
    marginRight: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  taskTitleDone: {
    color: "#CCCCCC",
    textDecorationLine: "line-through",
  },
  taskTime: {
    fontSize: 15,
    fontWeight: "400",
    color: "#BBBBBB",
    marginLeft: 12,
  },

  /* Empty state */
  emptyWrap: {
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: "center",
    gap: 6,
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
