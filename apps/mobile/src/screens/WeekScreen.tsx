import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/client";
import {
  getMondayISO,
  addDays,
  buildWeekDates,
  formatDate,
  todayISO,
} from "../utils/dates";
import { CheckIcon, XIcon } from "../components/HabitIcons";

type DayStatus = "UNSET" | "DONE" | "MISSED";

// statuses[habitId][dayISO] = DayStatus
type StatusMap = Record<string, Record<string, DayStatus>>;

const DAY_LABELS = ["M", "Tu", "W", "Th", "F", "Sa", "Su"];

function nextStatus(current: DayStatus): DayStatus {
  if (current === "UNSET") return "DONE";
  if (current === "DONE") return "MISSED";
  return "UNSET";
}

export default function WeekScreen() {
  const { token } = useAuth();
  const [mondayISO, setMondayISO] = useState(() => getMondayISO());
  const weekDates = buildWeekDates(mondayISO);
  const sundayISO = weekDates[6];

  const [habits, setHabits] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<StatusMap>({});

  const today = todayISO();
  const todayColIndex = weekDates.indexOf(today);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      loadData();
    }, [token, mondayISO]),
  );

  async function loadData() {
    try {
      const [habitsData, daysData] = await Promise.all([
        fetch(`${API_URL}/habits`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
        fetch(`${API_URL}/habit-days`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
      ]);

      setHabits(Array.isArray(habitsData) ? habitsData : []);

      // Build statuses[habitId][dayISO] for this week only
      const map: StatusMap = {};
      if (Array.isArray(daysData)) {
        daysData.forEach((d: any) => {
          const dayStr = d.date?.split("T")[0];
          if (weekDates.includes(dayStr)) {
            if (!map[d.habitId]) map[d.habitId] = {};
            map[d.habitId][dayStr] = d.status as DayStatus;
          }
        });
      }
      setStatuses(map);
    } catch (err) {
      console.log("fetch error:", err);
    }
  }

  async function handleCheckIn(habitId: string, dayISO: string) {
    const current = statuses[habitId]?.[dayISO] ?? "UNSET";
    const next = nextStatus(current);

    // Optimistic update
    setStatuses((prev) => ({
      ...prev,
      [habitId]: { ...(prev[habitId] ?? {}), [dayISO]: next },
    }));

    try {
      const res = await fetch(`${API_URL}/habit-days`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ habitId, date: dayISO, status: next }),
      });
      if (!res.ok) {
        setStatuses((prev) => ({
          ...prev,
          [habitId]: { ...(prev[habitId] ?? {}), [dayISO]: current },
        }));
        Alert.alert("Error", "Failed to save check-in");
      }
    } catch {
      setStatuses((prev) => ({
        ...prev,
        [habitId]: { ...(prev[habitId] ?? {}), [dayISO]: current },
      }));
      Alert.alert("Error", "Network error — try again");
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>WEEKLY</Text>
          <Text style={styles.title}>Weekly</Text>
        </View>
      </View>

      {/* Date nav card */}
      <View style={styles.dateCard}>
        <View style={styles.dateRow}>
          <View style={styles.datePill}>
            <Text style={styles.datePillText}>{formatDate(mondayISO)}</Text>
          </View>
          <TouchableOpacity
            style={styles.arrowBtn}
            onPress={() => setMondayISO(addDays(mondayISO, -7))}
          >
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.arrowBtn}
            onPress={() => setMondayISO(addDays(mondayISO, 7))}
          >
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
          <View style={styles.datePill}>
            <Text style={styles.datePillText}>{formatDate(sundayISO)}</Text>
          </View>
        </View>

        {/* Day headers — aligned to cells below */}
        <View style={styles.dayHeaderRow}>
          <View style={styles.habitNameCol} />
          {DAY_LABELS.map((label, i) => (
            <View key={i} style={styles.cellSlot}>
              <Text
                style={[
                  styles.dayLabel,
                  i === todayColIndex && styles.dayLabelToday,
                ]}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Habit rows */}
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.habitCard}>
            <Text style={styles.habitName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.cellRow}>
              {weekDates.map((dayISO, i) => {
                const status = statuses[item.id]?.[dayISO] ?? "UNSET";
                const isToday = i === todayColIndex;

                return (
                  <TouchableOpacity
                    key={dayISO}
                    style={[styles.cell, isToday && styles.cellToday]}
                    onPress={() => handleCheckIn(item.id, dayISO)}
                  >
                    {status === "DONE" && <CheckIcon size={30} />}
                    {status === "MISSED" && <XIcon size={30} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const CELL_SIZE = 34;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000603",
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  eyebrow: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#3a7a5a",
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "400",
    color: "#98FF9D",
  },
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
    width: 80,
    fontSize: 13,
    color: "#98eaff",
    flexShrink: 0,
    paddingRight: 4,
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
  cellLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
