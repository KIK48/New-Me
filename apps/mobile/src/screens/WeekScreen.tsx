import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/client";
import { addDays, addMonths, buildWeekDates, getMondayISO, todayISO } from "../utils/dates";
import DailyView from "./week/DailyView";
import WeeklyView from "./week/WeeklyView";
import MonthlyView from "./week/MonthlyView";
import YearlyView from "./week/YearlyView";
import { DayStatus, Habit, HabitLogEntry, StatusMap, ViewMode } from "./week/types";

const VIEW_OPTIONS: { key: ViewMode; label: string }[] = [
  { key: "daily", label: "Day" },
  { key: "weekly", label: "Week" },
  { key: "monthly", label: "Month" },
  { key: "yearly", label: "Year" },
];

export default function WeekScreen() {
  const { token } = useAuth();
  const isFocused = useIsFocused();

  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [statuses, setStatuses] = useState<StatusMap>({});
  const [logs, setLogs] = useState<HabitLogEntry[]>([]);

  // Per-view navigation anchors — kept independent so switching views doesn't lose your place
  const [selectedDateISO, setSelectedDateISO] = useState(() => todayISO());
  const [mondayISO, setMondayISO] = useState(() => getMondayISO());
  const now = new Date();
  const [monthAnchor, setMonthAnchor] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [yearAnchor, setYearAnchor] = useState(now.getFullYear());

  // Fetches the full habit-day history once per focus/token change — Monthly and
  // Yearly views need long-range data anyway, so all 4 views share one dataset.
  useEffect(() => {
    if (!token || !isFocused) return;

    Promise.all([
      fetch(`${API_URL}/habits`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API_URL}/habit-days`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API_URL}/habit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([habitsData, daysData, logsData]) => {
        setHabits(Array.isArray(habitsData) ? habitsData : []);

        const map: StatusMap = {};
        if (Array.isArray(daysData)) {
          daysData.forEach((d: any) => {
            const dayStr = d.date?.split("T")[0];
            if (!map[d.habitId]) map[d.habitId] = {};
            map[d.habitId][dayStr] = d.status as DayStatus;
          });
        }
        setStatuses(map);
        setLogs(Array.isArray(logsData) ? logsData : []);
      })
      .catch((err) => console.log("fetch error:", err));
  }, [token, isFocused]);

  async function handleCheckIn(habitId: string, dayISO: string, next: DayStatus) {
    const current = statuses[habitId]?.[dayISO] ?? "UNSET";

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

  function handleWeeklyCellPress(habitId: string, dayISO: string) {
    const current = statuses[habitId]?.[dayISO] ?? "UNSET";
    const next: DayStatus = current === "UNSET" ? "DONE" : current === "DONE" ? "MISSED" : "UNSET";
    handleCheckIn(habitId, dayISO, next);
  }

  // For DAILY habits with frequencyCount > 1 (e.g. "eat 2x/day") — each tap adds
  // one timestamped completion instead of toggling a single day-level status.
  async function handleAddLog(habitId: string) {
    const tempId = `temp-${Date.now()}`;
    const optimisticLog: HabitLogEntry = { id: tempId, habitId, loggedAt: new Date().toISOString() };
    setLogs((prev) => [optimisticLog, ...prev]);

    try {
      const res = await fetch(`${API_URL}/habit-logs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ habitId }),
      });
      if (!res.ok) throw new Error("Failed to log");
      const saved = await res.json();
      setLogs((prev) => prev.map((l) => (l.id === tempId ? saved : l)));
    } catch {
      setLogs((prev) => prev.filter((l) => l.id !== tempId));
      Alert.alert("Error", "Failed to save — try again");
    }
  }

  async function handleDeleteLog(logId: string) {
    const removed = logs.find((l) => l.id === logId);
    setLogs((prev) => prev.filter((l) => l.id !== logId));

    try {
      const res = await fetch(`${API_URL}/habit-logs/${logId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
    } catch {
      if (removed) setLogs((prev) => [removed, ...prev]);
      Alert.alert("Error", "Failed to undo — try again");
    }
  }

  // Each view only shows habits whose rule actually lives in that scope —
  // e.g. "gym 5x/week" is a WEEKLY habit and only appears in the Weekly view.
  const dailyHabits = habits.filter((h) => (h.frequencyType ?? "DAILY") === "DAILY");
  const weeklyHabits = habits.filter((h) => h.frequencyType === "WEEKLY");
  const monthlyHabits = habits.filter((h) => h.frequencyType === "MONTHLY");
  const yearlyHabits = habits.filter((h) => h.frequencyType === "YEARLY");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CALENDAR</Text>
        <Text style={styles.title}>Calendar</Text>
      </View>

      <View style={styles.viewSwitcher}>
        {VIEW_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.viewPill, viewMode === opt.key && styles.viewPillActive]}
            onPress={() => setViewMode(opt.key)}
          >
            <Text style={[styles.viewPillText, viewMode === opt.key && styles.viewPillTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {viewMode === "daily" && (
        <DailyView
          dateISO={selectedDateISO}
          habits={dailyHabits}
          statuses={statuses}
          logs={logs}
          onPrevDay={() => setSelectedDateISO((d) => addDays(d, -1))}
          onNextDay={() => setSelectedDateISO((d) => addDays(d, 1))}
          onCheckIn={(habitId, next) => handleCheckIn(habitId, selectedDateISO, next)}
          onAddLog={handleAddLog}
          onDeleteLog={handleDeleteLog}
        />
      )}

      {viewMode === "weekly" && (
        <WeeklyView
          mondayISO={mondayISO}
          weekDates={buildWeekDates(mondayISO)}
          habits={weeklyHabits}
          statuses={statuses}
          onPrevWeek={() => setMondayISO((d) => addDays(d, -7))}
          onNextWeek={() => setMondayISO((d) => addDays(d, 7))}
          onCellPress={handleWeeklyCellPress}
        />
      )}

      {viewMode === "monthly" && (
        <MonthlyView
          year={monthAnchor.year}
          month={monthAnchor.month}
          habits={monthlyHabits}
          statuses={statuses}
          onPrevMonth={() => setMonthAnchor((a) => addMonths(a.year, a.month, -1))}
          onNextMonth={() => setMonthAnchor((a) => addMonths(a.year, a.month, 1))}
          onCheckIn={handleCheckIn}
        />
      )}

      {viewMode === "yearly" && (
        <YearlyView
          year={yearAnchor}
          habits={yearlyHabits}
          statuses={statuses}
          onPrevYear={() => setYearAnchor((y) => y - 1)}
          onNextYear={() => setYearAnchor((y) => y + 1)}
          onCheckIn={handleCheckIn}
        />
      )}
    </View>
  );
}

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
  viewSwitcher: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "#085331",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  viewPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  viewPillActive: {
    backgroundColor: "#009951",
  },
  viewPillText: {
    fontSize: 13,
    color: "#3a7a5a",
  },
  viewPillTextActive: {
    color: "#98FF9D",
    fontWeight: "600",
  },
});
