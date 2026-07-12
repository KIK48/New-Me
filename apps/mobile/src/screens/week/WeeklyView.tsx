import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { formatDate, todayISO } from "../../utils/dates";
import { CheckIcon, XIcon } from "../../components/HabitIcons";
import { DayStatus, Habit, StatusMap } from "./types";

const DAY_LABELS = ["M", "Tu", "W", "Th", "F", "Sa", "Su"];
const CELL_SIZE = 34;

interface Props {
  mondayISO: string;
  weekDates: string[];
  habits: Habit[];
  statuses: StatusMap;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCellPress: (habitId: string, dayISO: string) => void;
}

export default function WeeklyView({
  mondayISO,
  weekDates,
  habits,
  statuses,
  onPrevWeek,
  onNextWeek,
  onCellPress,
}: Props) {
  const sundayISO = weekDates[6];
  const today = todayISO();
  const todayColIndex = weekDates.indexOf(today);

  const totalCells = habits.length * 7;
  const doneCells = habits.reduce(
    (sum, h) => sum + weekDates.filter((d) => statuses[h.id]?.[d] === "DONE").length,
    0,
  );
  const weekPct = totalCells > 0 ? Math.round((doneCells / totalCells) * 100) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.dateCard}>
        <View style={styles.dateRow}>
          <View style={styles.datePill}>
            <Text style={styles.datePillText}>{formatDate(mondayISO)}</Text>
          </View>
          <TouchableOpacity style={styles.arrowBtn} onPress={onPrevWeek}>
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.arrowBtn} onPress={onNextWeek}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
          <View style={styles.datePill}>
            <Text style={styles.datePillText}>{formatDate(sundayISO)}</Text>
          </View>
          {habits.length > 0 && (
            <View style={styles.pctPill}>
              <Text style={styles.pctPillText}>{weekPct}%</Text>
            </View>
          )}
        </View>

        {/* Day headers — aligned to cells below */}
        <View style={styles.dayHeaderRow}>
          <View style={styles.habitNameCol} />
          {DAY_LABELS.map((label, i) => (
            <View key={i} style={styles.cellSlot}>
              <Text style={[styles.dayLabel, i === todayColIndex && styles.dayLabelToday]}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {habits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No weekly habits yet. Set a habit's frequency to Weekly in Edit Habit to see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const target = item.frequencyCount ?? 1;
            const count = weekDates.filter((d) => statuses[item.id]?.[d] === "DONE").length;

            return (
              <View style={styles.habitCard}>
                <View style={styles.habitNameCol}>
                  <Text style={styles.habitName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.habitTarget}>
                    {count}/{target}
                  </Text>
                </View>
                <View style={styles.cellRow}>
                  {weekDates.map((dayISO, i) => {
                    const status: DayStatus = statuses[item.id]?.[dayISO] ?? "UNSET";
                    const isToday = i === todayColIndex;

                    return (
                      <TouchableOpacity
                        key={dayISO}
                        style={[styles.cell, isToday && styles.cellToday]}
                        onPress={() => onCellPress(item.id, dayISO)}
                      >
                        {status === "DONE" && <CheckIcon size={30} />}
                        {status === "MISSED" && <XIcon size={30} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  dateCard: {
    backgroundColor: "#085331",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 8,
    marginBottom: 8,
  },
  datePill: {
    flex: 1,
    backgroundColor: "#000",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  datePillText: {
    fontSize: 11,
    color: "#98eaff",
  },
  pctPill: {
    backgroundColor: "rgba(0,153,81,0.25)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#009951",
  },
  pctPillText: {
    fontSize: 12,
    color: "#98FF9D",
    fontWeight: "600",
  },
  arrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  arrowText: {
    fontSize: 20,
    color: "#98eaff",
    lineHeight: 24,
  },
  dayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  habitNameCol: {
    width: 80,
    flexShrink: 0,
  },
  cellSlot: {
    width: CELL_SIZE,
    alignItems: "center",
    marginHorizontal: 2,
  },
  dayLabel: {
    fontSize: 11,
    color: "#98eaff",
    fontWeight: "400",
  },
  dayLabelToday: {
    color: "#98FF9D",
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 8,
  },
  habitCard: {
    backgroundColor: "#085331",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  habitName: {
    fontSize: 13,
    color: "#98eaff",
    paddingRight: 4,
  },
  habitTarget: {
    fontSize: 11,
    color: "#3a7a5a",
    marginTop: 2,
  },
  emptyState: {
    marginHorizontal: 16,
    padding: 20,
  },
  emptyText: {
    fontSize: 13,
    color: "#3a7a5a",
    textAlign: "center",
    lineHeight: 20,
  },
  cellRow: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 8,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.08)",
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: "rgba(152,234,255,0.45)",
  },
});
