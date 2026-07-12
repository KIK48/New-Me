import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { MONTH_ABBR, addDays, todayISO } from "../../utils/dates";
import { CheckIcon, XIcon } from "../../components/HabitIcons";
import { DayStatus, Habit, StatusMap } from "./types";

interface Props {
  year: number;
  habits: Habit[];
  statuses: StatusMap;
  onPrevYear: () => void;
  onNextYear: () => void;
  onCheckIn: (habitId: string, dateISO: string, next: DayStatus) => void;
}

// Defaults the log cursor to today (current year), or Dec 31 of a past year —
// there's no meaningful "today" to default to once you're browsing history.
function defaultLogDate(year: number, today: string): string {
  const todayYear = Number(today.split("-")[0]);
  if (year === todayYear) return today;
  const dec31 = `${year}-12-31`;
  return dec31 > today ? `${year}-01-01` : dec31;
}

function formatShort(dateISO: string): string {
  const [, m, d] = dateISO.split("-").map(Number);
  return `${MONTH_ABBR[m - 1]} ${d}`;
}

export default function YearlyView({ year, habits, statuses, onPrevYear, onNextYear, onCheckIn }: Props) {
  const today = todayISO();
  const yearPrefix = `${year}-`;
  const jan1 = `${year}-01-01`;
  const dec31 = `${year}-12-31`;

  const [logDateISO, setLogDateISO] = useState(() => defaultLogDate(year, today));
  useEffect(() => {
    setLogDateISO(defaultLogDate(year, today));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const canLog = logDateISO <= today;
  const canGoPrev = logDateISO > jan1;
  const canGoNext = logDateISO < dec31 && addDays(logDateISO, 1) <= today;

  return (
    <View style={styles.wrap}>
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.arrowBtn} onPress={onPrevYear}>
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.yearLabel}>{year}</Text>
        <TouchableOpacity style={styles.arrowBtn} onPress={onNextYear}>
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logDayRow}>
        <TouchableOpacity
          disabled={!canGoPrev}
          style={[styles.dayArrowBtn, !canGoPrev && styles.dayArrowBtnDisabled]}
          onPress={() => setLogDateISO((d) => addDays(d, -1))}
        >
          <Text style={styles.dayArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.logDayLabel}>Logging for {formatShort(logDateISO)}</Text>
        <TouchableOpacity
          disabled={!canGoNext}
          style={[styles.dayArrowBtn, !canGoNext && styles.dayArrowBtnDisabled]}
          onPress={() => setLogDateISO((d) => addDays(d, 1))}
        >
          <Text style={styles.dayArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {habits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No yearly habits yet. Set a habit's frequency to Yearly in Edit Habit to see it here.
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
              ([date, status]) => status === "DONE" && date.startsWith(yearPrefix),
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
  yearLabel: {
    fontSize: 20,
    color: "#98eaff",
    minWidth: 60,
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
