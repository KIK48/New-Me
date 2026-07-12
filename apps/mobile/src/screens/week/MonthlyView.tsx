import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { MONTH_ABBR, MONTH_LABELS, daysInMonth, todayISO } from "../../utils/dates";
import { CheckIcon, XIcon } from "../../components/HabitIcons";
import { DayStatus, Habit, StatusMap } from "./types";

interface Props {
  year: number;
  month: number; // 1-indexed
  habits: Habit[];
  statuses: StatusMap;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCheckIn: (habitId: string, dateISO: string, next: DayStatus) => void;
}

// Defaults the log cursor to today (current month), or the last day of a past month —
// there's no meaningful "today" to default to once you're browsing history.
function defaultLogDay(year: number, month: number, today: string): number {
  const [ty, tm] = today.split("-").map(Number);
  if (year === ty && month === tm) return Number(today.split("-")[2]);
  const firstOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
  return firstOfMonth > today ? 1 : daysInMonth(year, month);
}

export default function MonthlyView({
  year,
  month,
  habits,
  statuses,
  onPrevMonth,
  onNextMonth,
  onCheckIn,
}: Props) {
  const today = todayISO();
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const monthLength = daysInMonth(year, month);

  const [logDay, setLogDay] = useState(() => defaultLogDay(year, month, today));
  useEffect(() => {
    setLogDay(defaultLogDay(year, month, today));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const logDateISO = `${monthPrefix}${String(logDay).padStart(2, "0")}`;
  const canLog = logDateISO <= today;
  const canGoNext = logDay < monthLength && `${monthPrefix}${String(logDay + 1).padStart(2, "0")}` <= today;

  return (
    <View style={styles.wrap}>
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.arrowBtn} onPress={onPrevMonth}>
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {MONTH_LABELS[month - 1]} {year}
        </Text>
        <TouchableOpacity style={styles.arrowBtn} onPress={onNextMonth}>
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logDayRow}>
        <TouchableOpacity
          disabled={logDay <= 1}
          style={[styles.dayArrowBtn, logDay <= 1 && styles.dayArrowBtnDisabled]}
          onPress={() => setLogDay((d) => d - 1)}
        >
          <Text style={styles.dayArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.logDayLabel}>
          Logging for {MONTH_ABBR[month - 1]} {logDay}
        </Text>
        <TouchableOpacity
          disabled={!canGoNext}
          style={[styles.dayArrowBtn, !canGoNext && styles.dayArrowBtnDisabled]}
          onPress={() => setLogDay((d) => d + 1)}
        >
          <Text style={styles.dayArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {habits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No monthly habits yet. Set a habit's frequency to Monthly in Edit Habit to see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const target = item.frequencyCount ?? 1;
            const count = Object.entries(statuses[item.id] ?? {}).filter(
              ([date, status]) => status === "DONE" && date.startsWith(monthPrefix),
            ).length;
            const pct = Math.min(Math.round((count / target) * 100), 100);
            const logDateStatus = statuses[item.id]?.[logDateISO] ?? "UNSET";

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <TouchableOpacity
                    disabled={!canLog}
                    style={[
                      styles.statusIcon,
                      logDateStatus === "DONE" && styles.statusIconDone,
                      logDateStatus === "MISSED" && styles.statusIconMissed,
                    ]}
                    onPress={() =>
                      onCheckIn(item.id, logDateISO, logDateStatus === "DONE" ? "UNSET" : "DONE")
                    }
                  >
                    {logDateStatus === "DONE" && <CheckIcon size={22} />}
                    {logDateStatus === "MISSED" && <XIcon size={22} />}
                  </TouchableOpacity>
                  <Text style={styles.habitName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.countText}>
                    {count}/{target}
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%` as any }]} />
                </View>
                {canLog && (
                  <TouchableOpacity
                    style={[styles.missedBtn, logDateStatus === "MISSED" && styles.missedBtnActive]}
                    onPress={() =>
                      onCheckIn(item.id, logDateISO, logDateStatus === "MISSED" ? "UNSET" : "MISSED")
                    }
                  >
                    <Text
                      style={[
                        styles.missedBtnText,
                        logDateStatus === "MISSED" && styles.missedBtnTextActive,
                      ]}
                    >
                      {logDateStatus === "MISSED" ? "Undo" : "Mark missed"}
                    </Text>
                  </TouchableOpacity>
                )}
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
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginBottom: 10,
  },
  monthLabel: {
    fontSize: 18,
    color: "#98eaff",
    minWidth: 140,
    textAlign: "center",
  },
  arrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#085331",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    fontSize: 20,
    color: "#98eaff",
    lineHeight: 24,
  },
  logDayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 14,
  },
  dayArrowBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#085331",
    alignItems: "center",
    justifyContent: "center",
  },
  dayArrowBtnDisabled: {
    opacity: 0.3,
  },
  dayArrowText: {
    fontSize: 15,
    color: "#98eaff",
    lineHeight: 18,
  },
  logDayLabel: {
    fontSize: 12,
    color: "#3a7a5a",
    minWidth: 150,
    textAlign: "center",
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
  list: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 10,
  },
  card: {
    backgroundColor: "#085331",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  statusIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.1)",
    flexShrink: 0,
  },
  statusIconDone: {
    borderColor: "#009951",
  },
  statusIconMissed: {
    borderColor: "#860000",
  },
  habitName: {
    fontSize: 16,
    color: "#98eaff",
    flex: 1,
  },
  countText: {
    fontSize: 14,
    color: "#98FF9D",
    fontWeight: "600",
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#009951",
  },
  missedBtn: {
    alignSelf: "flex-end",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(134,0,0,0.4)",
  },
  missedBtnActive: {
    backgroundColor: "rgba(134,0,0,0.2)",
    borderColor: "#860000",
  },
  missedBtnText: {
    fontSize: 11,
    color: "rgba(255,85,85,0.5)",
  },
  missedBtnTextActive: {
    color: "#ff5555",
  },
});
