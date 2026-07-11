import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { AppStack } from "../navigation/types";
import { API_URL } from "../api/client";
import { todayISO, addDays } from "../utils/dates";
import { calculateStreak } from "../utils/streak";

type Props = NativeStackScreenProps<AppStack, "HabitDetail">;
type DayStatus = "UNSET" | "DONE" | "MISSED";

// Build an array of the last N ISO date strings ending today
function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(addDays(todayISO(), -i));
  }
  return days;
}

function freqLabel(frequency: { type: string; count: number }): string {
  if (frequency.type === "DAILY")
    return frequency.count === 1 ? "Daily" : `${frequency.count}× per day`;
  if (frequency.type === "WEEKLY")
    return frequency.count === 7 ? "Every day" : `${frequency.count}× per week`;
  if (frequency.type === "MONTHLY")
    return frequency.count === 1 ? "Once a month" : `${frequency.count}× per month`;
  return frequency.count === 1 ? "Once a year" : `${frequency.count}× per year`;
}

export default function HabitDetailScreen({ route, navigation }: Props) {
  const { id, name, notes, frequency } = route.params;
  const { token } = useAuth();
  const [allDays, setAllDays] = useState<Record<string, DayStatus>>({});

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      fetch(`${API_URL}/habit-days`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data: any[]) => {
          const map: Record<string, DayStatus> = {};
          if (Array.isArray(data)) {
            data
              .filter((d) => d.habitId === id)
              .forEach((d) => {
                map[d.date?.split("T")[0]] = d.status as DayStatus;
              });
          }
          setAllDays(map);
        })
        .catch(console.error);
    }, [token, id]),
  );

  const days30 = lastNDays(30);
  const done30 = days30.filter((d) => allDays[d] === "DONE").length;
  const total = Object.values(allDays).filter((s) => s !== "UNSET").length;
  const totalDone = Object.values(allDays).filter((s) => s === "DONE").length;
  const pct = total > 0 ? Math.round((totalDone / total) * 100) : 0;
  const streak = calculateStreak(allDays, { type: frequency.type, count: frequency.count });

  async function handleDelete() {
    Alert.alert("Delete Habit", `Remove "${name}" and all its history?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/habits/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              navigation.goBack();
            } else {
              Alert.alert("Error", "Failed to delete habit.");
            }
          } catch {
            Alert.alert("Error", "Network error — try again.");
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.eyebrow}>HABIT</Text>
        <Text style={styles.title} numberOfLines={2}>{name}</Text>
        <Text style={styles.freqBadge}>{freqLabel(frequency)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{done30}</Text>
            <Text style={styles.statLabel}>last 30 days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalDone}</Text>
            <Text style={styles.statLabel}>all time done</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pct}%</Text>
            <Text style={styles.statLabel}>completion</Text>
          </View>
        </View>

        {/* 30-day dot grid */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>LAST 30 DAYS</Text>
          <View style={styles.dotGrid}>
            {days30.map((d) => {
              const s = allDays[d] ?? "UNSET";
              return (
                <View
                  key={d}
                  style={[
                    styles.dot,
                    s === "DONE" && styles.dotDone,
                    s === "MISSED" && styles.dotMissed,
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, styles.dotDone]} />
              <Text style={styles.legendText}>Done</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, styles.dotMissed]} />
              <Text style={styles.legendText}>Missed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.dot} />
              <Text style={styles.legendText}>Not set</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {notes ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>NOTES</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        ) : null}

        {/* Actions */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate("EditHabit", { id, name, notes, frequency })}
        >
          <Text style={styles.editBtnText}>Edit Habit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete Habit</Text>
        </TouchableOpacity>
      </ScrollView>
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
  backBtn: {
    marginBottom: 12,
  },
  backText: {
    color: "#3a7a5a",
    fontSize: 16,
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
    color: "#98eaff",
  },
  freqBadge: {
    fontSize: 12,
    color: "#3a7a5a",
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "47.5%",
    backgroundColor: "#085331",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "400",
    color: "#98FF9D",
  },
  statLabel: {
    fontSize: 10,
    color: "#3a7a5a",
    marginTop: 2,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#085331",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  cardLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#3a7a5a",
    marginBottom: 12,
  },
  dotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: "#000",
  },
  dotDone: {
    backgroundColor: "#009951",
  },
  dotMissed: {
    backgroundColor: "#860000",
  },
  legend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendText: {
    fontSize: 11,
    color: "#3a7a5a",
  },
  notesText: {
    fontSize: 15,
    color: "#98eaff",
    lineHeight: 22,
  },
  editBtn: {
    backgroundColor: "#085331",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.15)",
  },
  editBtnText: {
    color: "#98eaff",
    fontSize: 15,
    fontWeight: "500",
  },
  deleteBtn: {
    alignSelf: "center",
    padding: 12,
  },
  deleteBtnText: {
    color: "#860000",
    fontSize: 14,
  },
});
