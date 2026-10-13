import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/client";
import { addDays, addMonths, buildWeekDates, getMondayISO, localDateOf, todayISO } from "../utils/dates";
import { loggedAtFor } from "../utils/periods";
import DailyView from "./week/DailyView";
import WeeklyView from "./week/WeeklyView";
import MonthlyView from "./week/MonthlyView";
import YearlyView from "./week/YearlyView";
import { DayStatus, Habit, HabitLogEntry, StatusMap, ViewMode } from "./week/types";
import { BORDER, PILL_INDICATOR } from "../theme";
import SlidingIndicator from "../components/SlidingIndicator";

const VIEW_OPTIONS: { key: ViewMode; label: string }[] = [
  { key: "daily", label: "Day" },
  { key: "weekly", label: "Week" },
  { key: "monthly", label: "Month" },
  { key: "yearly", label: "Year" },
];

const SWITCHER_PADDING = 4;
const SWITCHER_GAP = 4;

const VIEW_EYEBROWS: Record<ViewMode, string> = {
  daily: "DAILY HABITS",
  weekly: "WEEKLY HABITS",
  monthly: "MONTHLY HABITS",
  yearly: "YEARLY HABITS",
};

export default function WeekScreen() {
  const { token, authorizedFetch } = useAuth();
  const isFocused = useIsFocused();

  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [switcherWidth, setSwitcherWidth] = useState(0);
  const activeIndex = VIEW_OPTIONS.findIndex((o) => o.key === viewMode);
  // Equal-width pills: total row width minus both paddings and the gaps between pills
  const pillWidth = switcherWidth > 0
    ? (switcherWidth - SWITCHER_PADDING * 2 - SWITCHER_GAP * (VIEW_OPTIONS.length - 1)) / VIEW_OPTIONS.length
    : 0;
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
      authorizedFetch(`${API_URL}/habits`).then((r) => r.json()),
      authorizedFetch(`${API_URL}/habit-days`).then((r) => r.json()),
      authorizedFetch(`${API_URL}/habit-logs`).then((r) => r.json()),
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
      const res = await authorizedFetch(`${API_URL}/habit-days`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
  // dayISO lets Month/Year/Week log against the date being viewed (not just "now").
  async function handleAddLog(habitId: string, dayISO?: string) {
    if (dayISO && dayISO > todayISO()) return; // can't log the future
    const loggedAt = loggedAtFor(dayISO, todayISO());
    const tempId = `temp-${Date.now()}`;
    const optimisticLog: HabitLogEntry = { id: tempId, habitId, loggedAt };
    setLogs((prev) => [optimisticLog, ...prev]);

    try {
      const res = await authorizedFetch(`${API_URL}/habit-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, loggedAt }),
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
      const res = await authorizedFetch(`${API_URL}/habit-logs/${logId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
    } catch {
      if (removed) setLogs((prev) => [removed, ...prev]);
      Alert.alert("Error", "Failed to undo — try again");
    }
  }

  // Week grid, habits with a target above 1: hold a day to undo its latest
  // completion (a log, or a legacy DONE checkmark that has no log behind it).
  function handleRemoveOnDay(habitId: string, dayISO: string) {
    const latest = logs
      .filter((l) => l.habitId === habitId && localDateOf(l.loggedAt) === dayISO)
      .sort((a, b) => (a.loggedAt < b.loggedAt ? 1 : -1))[0];
    if (latest) handleDeleteLog(latest.id);
    else if (statuses[habitId]?.[dayISO] === "DONE") handleCheckIn(habitId, dayISO, "UNSET");
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
        {/* Tells you which habits this view shows, instead of repeating the title */}
        <Text style={styles.eyebrow}>{VIEW_EYEBROWS[viewMode]}</Text>
        <Text style={styles.title}>Calendar</Text>
      </View>

      <View style={styles.viewSwitcher}>
        {/* Row is measured (not the bordered outer view) so pill widths exclude the border */}
        <View style={styles.viewSwitcherRow} onLayout={(e) => setSwitcherWidth(e.nativeEvent.layout.width)}>
          {pillWidth > 0 && (
            <SlidingIndicator
              x={SWITCHER_PADDING + activeIndex * (pillWidth + SWITCHER_GAP)}
              style={[styles.pillIndicator, { width: pillWidth }]}
            />
          )}
          {VIEW_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={styles.viewPill}
              onPress={() => setViewMode(opt.key)}
            >
              <Text style={[styles.viewPillText, viewMode === opt.key && styles.viewPillTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
          logs={logs}
          onPrevWeek={() => setMondayISO((d) => addDays(d, -7))}
          onNextWeek={() => setMondayISO((d) => addDays(d, 7))}
          onCellPress={handleWeeklyCellPress}
          onCellAddLog={handleAddLog}
          onCellRemove={handleRemoveOnDay}
        />
      )}

      {viewMode === "monthly" && (
        <MonthlyView
          year={monthAnchor.year}
          month={monthAnchor.month}
          habits={monthlyHabits}
          statuses={statuses}
          logs={logs}
          onPrevMonth={() => setMonthAnchor((a) => addMonths(a.year, a.month, -1))}
          onNextMonth={() => setMonthAnchor((a) => addMonths(a.year, a.month, 1))}
          onCheckIn={handleCheckIn}
          onAddLog={handleAddLog}
          onDeleteLog={handleDeleteLog}
        />
      )}

      {viewMode === "yearly" && (
        <YearlyView
          year={yearAnchor}
          habits={yearlyHabits}
          statuses={statuses}
          logs={logs}
          onPrevYear={() => setYearAnchor((y) => y - 1)}
          onNextYear={() => setYearAnchor((y) => y + 1)}
          onCheckIn={handleCheckIn}
          onAddLog={handleAddLog}
          onDeleteLog={handleDeleteLog}
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
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "#085331",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
  },
  viewSwitcherRow: {
    flexDirection: "row",
    padding: SWITCHER_PADDING,
    gap: SWITCHER_GAP,
  },
  // Sits behind the pills and glides to the selected one (width is set from the measured row)
  pillIndicator: {
    top: SWITCHER_PADDING,
    bottom: SWITCHER_PADDING,
    borderRadius: 10,
    backgroundColor: PILL_INDICATOR,
  },
  viewPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
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
