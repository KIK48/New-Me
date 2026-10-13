import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { CheckIcon, XIcon } from "../../components/HabitIcons";
import AnimatedProgressBar from "../../components/AnimatedProgressBar";
import MultiCountHabitCard from "../../components/MultiCountHabitCard";
import { localDateOf, todayISO } from "../../utils/dates";
import { DayStatus, Habit, HabitLogEntry, StatusMap } from "./types";
import { BORDER, BORDER_DONE, BORDER_MISSED } from "../../theme";
import { slideIn } from "../../components/SlideInView";

interface Props {
  dateISO: string;
  habits: Habit[];
  statuses: StatusMap;
  logs: HabitLogEntry[];
  onPrevDay: () => void;
  onNextDay: () => void;
  onCheckIn: (habitId: string, next: DayStatus) => void;
  onAddLog: (habitId: string) => void;
  onDeleteLog: (logId: string) => void;
}

export default function DailyView({
  dateISO,
  habits,
  statuses,
  logs,
  onPrevDay,
  onNextDay,
  onCheckIn,
  onAddLog,
  onDeleteLog,
}: Props) {
  const today = todayISO();
  const isToday = dateISO === today;
  const canLogToday = dateISO === today; // "now" only makes sense for the day you're viewing
  const dateLabel = new Date(dateISO + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  function logsForHabitOnDate(habitId: string) {
    return logs.filter((l) => l.habitId === habitId && localDateOf(l.loggedAt) === dateISO);
  }

  // A multi-count habit (target > 1) contributes partial credit — e.g. 1 of 2
  // logs is worth 0.5 of a habit — instead of only counting once fully done.
  function completionFraction(h: Habit): number {
    const target = h.frequencyCount ?? 1;
    if (target > 1) return Math.min(logsForHabitOnDate(h.id).length / target, 1);
    return statuses[h.id]?.[dateISO] === "DONE" ? 1 : 0;
  }

  const fractionalDone = habits.reduce((sum, h) => sum + completionFraction(h), 0);
  const pct = habits.length > 0 ? Math.round((fractionalDone / habits.length) * 100) : 0;
  const done = habits.filter((h) => completionFraction(h) >= 1).length;

  return (
    <View style={styles.wrap}>
      <View style={styles.dateCard}>
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.arrowBtn} onPress={onPrevDay}>
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.dateLabel}>{isToday ? "Today" : dateLabel}</Text>
          <TouchableOpacity style={styles.arrowBtn} onPress={onNextDay}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressRow}>
          <AnimatedProgressBar
            pct={pct}
            trackStyle={styles.progressTrack}
            fillStyle={styles.progressFill}
          />
          <Text style={styles.progressCount}>
            {done}/{habits.length}
          </Text>
        </View>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) =>
          slideIn(index, () => {
          const target = item.frequencyCount ?? 1;

          if (target > 1) {
            const dayLogs = logsForHabitOnDate(item.id).sort((a, b) =>
              a.loggedAt < b.loggedAt ? 1 : -1,
            );
            const isMissed = statuses[item.id]?.[dateISO] === "MISSED";

            return (
              <MultiCountHabitCard
                name={item.name}
                count={dayLogs.length}
                target={target}
                canLog={canLogToday}
                isMissed={isMissed}
                logs={dayLogs}
                onAddLog={() => onAddLog(item.id)}
                onDeleteLog={onDeleteLog}
                onToggleMissed={() => onCheckIn(item.id, isMissed ? "UNSET" : "MISSED")}
              />
            );
          }

          const status = statuses[item.id]?.[dateISO] ?? "UNSET";
          const nameColor =
            status === "DONE" ? "#98FF9D" : status === "MISSED" ? "#ff5555" : "#98eaff";

          return (
            <TouchableOpacity
              style={[styles.habitCard, status === "MISSED" && styles.cardMissed, status === "DONE" && styles.cardDone]}
              onPress={() => onCheckIn(item.id, status === "DONE" ? "UNSET" : "DONE")}
            >
              <View
                style={[
                  styles.statusIcon,
                  status === "DONE" && styles.statusIconDone,
                  status === "MISSED" && styles.statusIconMissed,
                ]}
              >
                {status === "DONE" && <CheckIcon size={36} />}
                {status === "MISSED" && <XIcon size={36} />}
              </View>
              <Text
                style={[
                  styles.habitName,
                  {
                    color: nameColor,
                    textDecorationLine: status === "MISSED" ? "line-through" : "none",
                  },
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <TouchableOpacity
                style={[styles.missedBtn, status === "MISSED" && styles.missedBtnActive]}
                onPress={() => onCheckIn(item.id, status === "MISSED" ? "UNSET" : "MISSED")}
              >
                <Text
                  style={[
                    styles.missedBtnText,
                    status === "MISSED" && styles.missedBtnTextActive,
                  ]}
                >
                  {status === "MISSED" ? "Undo" : "Missed"}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Outline turns light green once the habit is completed
  cardDone: { borderColor: BORDER_DONE },
  cardMissed: { borderColor: BORDER_MISSED },
  wrap: { flex: 1 },
  dateCard: {
    backgroundColor: "#085331",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 16,
    color: "#98eaff",
  },
  arrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    fontSize: 20,
    color: "#98eaff",
    lineHeight: 24,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#98FF9D",
  },
  progressCount: {
    fontSize: 13,
    color: "#98FF9D",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 8,
  },
  habitCard: {
    backgroundColor: "#085331",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIcon: {
    width: 40,
    height: 40,
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
    flex: 1,
    fontSize: 15,
    color: "#98eaff",
  },
  missedBtn: {
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
