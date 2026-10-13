import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CheckIcon, XIcon } from "./HabitIcons";
import AnimatedProgressBar from "./AnimatedProgressBar";
import { formatTime } from "../utils/dates";

interface LogEntry {
  id: string;
  loggedAt: string;
}

interface Props {
  name: string;
  count: number;
  target: number;
  canLog: boolean; // whether logging is allowed for the date being viewed (not future)
  isMissed: boolean;
  logs: LogEntry[]; // already filtered/sorted for the date being viewed
  onAddLog: () => void;
  onDeleteLog: (logId: string) => void;
  onToggleMissed: () => void;
}

// Shared by HabitsScreen (today only), DailyView, MonthlyView, and YearlyView
// so frequencyCount > 1 habits ("eat 2x/day") behave identically everywhere —
// each tap logs one completion instead of toggling a single day-level status.
export default function MultiCountHabitCard({
  name,
  count,
  target,
  canLog,
  isMissed,
  logs,
  onAddLog,
  onDeleteLog,
  onToggleMissed,
}: Props) {
  const barPct = Math.min(Math.round((count / target) * 100), 100);
  const isFullyDone = count >= target;

  return (
    <View style={styles.multiCard}>
      <View style={styles.cardTop}>
        <TouchableOpacity
          disabled={!canLog}
          style={[
            styles.statusIcon,
            isFullyDone && styles.statusIconDone,
            !isFullyDone && isMissed && styles.statusIconMissed,
          ]}
          onPress={onAddLog}
        >
          {isFullyDone && <CheckIcon size={28} />}
          {!isFullyDone && isMissed && <XIcon size={28} />}
        </TouchableOpacity>
        <Text style={styles.habitName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.countText}>
          {count}/{target}
        </Text>
      </View>

      <AnimatedProgressBar pct={barPct} trackStyle={styles.barTrack} fillStyle={styles.barFill} />

      {logs.length > 0 && (
        <View style={styles.logRows}>
          {logs.map((log) => (
            <View key={log.id} style={styles.logRow}>
              <Text style={styles.logTime}>{formatTime(log.loggedAt)}</Text>
              <TouchableOpacity onPress={() => onDeleteLog(log.id)}>
                <Text style={styles.logRemove}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.multiActionsRow}>
        {canLog && (
          <TouchableOpacity style={styles.addLogBtn} onPress={onAddLog}>
            <Text style={styles.addLogText}>+ Log now</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.missedBtn, isMissed && styles.missedBtnActive]}
          onPress={onToggleMissed}
        >
          <Text style={[styles.missedBtnText, isMissed && styles.missedBtnTextActive]}>
            {isMissed ? "Undo" : "Missed"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  multiCard: {
    backgroundColor: "#085331",
    borderRadius: 14,
    padding: 14,
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
  logRows: {
    marginTop: 10,
    gap: 6,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#000",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logTime: {
    fontSize: 12,
    color: "#98eaff",
  },
  logRemove: {
    fontSize: 11,
    color: "rgba(255,85,85,0.7)",
  },
  multiActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  addLogBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#009951",
  },
  addLogText: {
    fontSize: 12,
    color: "#98FF9D",
    fontWeight: "600",
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
