import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/client";
import {
  getMondayISO,
  addDays,
  buildWeekDates,
  formatDate,
} from "../utils/dates";

type DayStatus = "UNSET" | "DONE" | "MISSED";

// statuses[habitId][dayISO] = DayStatus
type StatusMap = Record<string, Record<string, DayStatus>>;

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

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

  function cellStyle(status: DayStatus) {
    if (status === "DONE") return [styles.cell, styles.cellDone];
    if (status === "MISSED") return [styles.cell, styles.cellMissed];
    return [styles.cell, styles.cellUnset];
  }

  function cellLabel(status: DayStatus) {
    if (status === "DONE") return "✓";
    if (status === "MISSED") return "✗";
    return "";
  }

  return (
    <View style={styles.container}>
      {/* Week navigation */}
      <View style={styles.weekNav}>
        <TouchableOpacity
          onPress={() => setMondayISO(addDays(mondayISO, -7))}
          style={styles.navArrow}
        >
          <Text style={styles.navArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.weekLabel}>
          {formatDate(mondayISO)} — {formatDate(sundayISO)}
        </Text>
        <TouchableOpacity
          onPress={() => setMondayISO(addDays(mondayISO, 7))}
          style={styles.navArrow}
        >
          <Text style={styles.navArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day label header */}
      <View style={styles.row}>
        <View style={styles.habitNameCol} />
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.dayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Habit rows */}
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.habitName} numberOfLines={1}>
              {item.name}
            </Text>
            {weekDates.map((dayISO) => {
              const status = statuses[item.id]?.[dayISO] ?? "UNSET";
              return (
                <TouchableOpacity
                  key={dayISO}
                  style={cellStyle(status)}
                  onPress={() => handleCheckIn(item.id, dayISO)}
                >
                  <Text style={styles.cellText}>{cellLabel(status)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      />
    </View>
  );
}

const CELL_SIZE = 36;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  navArrow: { padding: 8 },
  navArrowText: { fontSize: 28, color: "#000", lineHeight: 32 },
  weekLabel: { fontSize: 15, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  habitNameCol: { width: 90 },
  habitName: {
    width: 90,
    fontSize: 13,
    color: "#333",
    paddingRight: 4,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  cellUnset: { borderWidth: 1.5, borderColor: "#e0e0e0" },
  cellDone: { backgroundColor: "#22c55e" },
  cellMissed: { backgroundColor: "#ef4444" },
  cellText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  dayLabel: { fontSize: 11, color: "#888", fontWeight: "600" },
});
