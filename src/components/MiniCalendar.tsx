import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CaretLeft, CaretRight } from "phosphor-react-native";
import { spacing } from "@/src/ui/tokens";
import {
  DAY_HEADERS_TR,
  LAYER,
  MONTH_NAMES_TR,
  toDateKey,
} from "./composerShared";

type MiniCalendarProps = {
  selectedDates: string[];
  onToggleDate: (dateKey: string) => void;
};

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const getFirstDayOfWeek = (year: number, month: number) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
};

const CELL = 38;
const COLS = 7;

export const MiniCalendar = ({ selectedDates, onToggleDate }: MiniCalendarProps) => {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);

  const handlePrevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);

  const rows: (number | null)[][] = useMemo(() => {
    const flat: (number | null)[] = [];
    for (let i = 0; i < firstDow; i++) flat.push(null);
    for (let d = 1; d <= daysInMonth; d++) flat.push(d);
    while (flat.length % COLS !== 0) flat.push(null);
    const result: (number | null)[][] = [];
    for (let i = 0; i < flat.length; i += COLS) {
      result.push(flat.slice(i, i + COLS));
    }
    return result;
  }, [firstDow, daysInMonth]);

  const buildKey = useCallback(
    (day: number) => {
      const m = String(viewMonth + 1).padStart(2, "0");
      const d = String(day).padStart(2, "0");
      return `${viewYear}-${m}-${d}`;
    },
    [viewYear, viewMonth],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handlePrevMonth}
          style={styles.navBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Önceki ay"
        >
          <CaretLeft size={16} color="rgba(17,17,17,0.5)" weight="bold" />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {MONTH_NAMES_TR[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity
          onPress={handleNextMonth}
          style={styles.navBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Sonraki ay"
        >
          <CaretRight size={16} color="rgba(17,17,17,0.5)" weight="bold" />
        </TouchableOpacity>
      </View>

      <View style={styles.dayHeaders}>
        {DAY_HEADERS_TR.map((label) => (
          <View key={label} style={styles.dayHeaderCell}>
            <Text style={styles.dayHeaderText}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {rows.map((row, rowIdx) => (
          <View key={`row-${rowIdx}`} style={styles.row}>
            {row.map((day, colIdx) => {
              if (day === null) {
                return <View key={`empty-${rowIdx}-${colIdx}`} style={styles.cell} />;
              }
              const key = buildKey(day);
              const isSelected = selectedSet.has(key);
              const isToday = key === todayKey;

              return (
                <TouchableOpacity
                  key={key}
                  style={styles.cell}
                  onPress={() => onToggleDate(key)}
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`${day} ${MONTH_NAMES_TR[viewMonth]}`}
                >
                  <View style={[styles.dayCirle, isSelected && styles.cellSelected]}>
                    <Text
                      style={[
                        styles.dayText,
                        isToday && !isSelected && styles.dayTextToday,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {selectedDates.length > 0 && (
        <Text style={styles.countLabel}>
          {selectedDates.length} tarih seçildi
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: LAYER.inset,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.2,
  },
  dayHeaders: {
    flexDirection: "row",
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 4,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(17,17,17,0.32)",
    letterSpacing: -0.1,
  },
  grid: {
    gap: 2,
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    height: CELL,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCirle: {
    width: CELL - 4,
    height: CELL - 4,
    borderRadius: (CELL - 4) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  cellSelected: {
    backgroundColor: "#111111",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(17,17,17,0.65)",
  },
  dayTextToday: {
    color: "#111111",
    fontWeight: "800",
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  countLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(17,17,17,0.38)",
    textAlign: "center",
    paddingTop: 2,
  },
});
