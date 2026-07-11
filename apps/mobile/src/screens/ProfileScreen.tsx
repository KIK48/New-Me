import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/client";
import {
  todayISO,
  getMondayISO,
  buildWeekDates,
} from "../utils/dates";
import { calculateStreak } from "../utils/streak";

type DayStatus = "UNSET" | "DONE" | "MISSED";

// Decode JWT payload to extract user email without a library
function getEmailFromToken(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.email ?? "";
  } catch {
    return "";
  }
}

export default function ProfileScreen() {
  const { token, logout } = useAuth();
  const [habits, setHabits] = useState<any[]>([]);
  const [allDays, setAllDays] = useState<any[]>([]);

  const email = useMemo(
    () => (token ? getEmailFromToken(token) : ""),
    [token],
  );
  const avatarLetter = email ? email[0].toUpperCase() : "?";

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      Promise.all([
        fetch(`${API_URL}/habits`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
        fetch(`${API_URL}/habit-days`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
      ])
        .then(([habitsData, daysData]) => {
          setHabits(Array.isArray(habitsData) ? habitsData : []);
          setAllDays(Array.isArray(daysData) ? daysData : []);
        })
        .catch(console.error);
    }, [token]),
  );

  // ── Real stats ────────────────────────────────────────────
  const today = todayISO();
  const weekDates = buildWeekDates(getMondayISO());

  const todayDone = allDays.filter(
    (d) => d.date?.startsWith(today) && d.status === "DONE",
  ).length;

  const weekDone = allDays.filter(
    (d) =>
      weekDates.includes(d.date?.split("T")[0]) && d.status === "DONE",
  ).length;
  const weekPct =
    habits.length > 0
      ? Math.round((weekDone / (habits.length * 7)) * 100)
      : 0;

  // Build a map of habitId → dayISO → status for this week's dots
  const weekMap: Record<string, Record<string, DayStatus>> = {};
  allDays.forEach((d: any) => {
    const dayStr = d.date?.split("T")[0];
    if (weekDates.includes(dayStr)) {
      if (!weekMap[d.habitId]) weekMap[d.habitId] = {};
      weekMap[d.habitId][dayStr] = d.status as DayStatus;
    }
  });

  // Best current streak across all habits
  const bestStreak = habits.reduce((best, h) => {
    const habitDayMap: Record<string, "DONE" | "MISSED" | "UNSET"> = {};
    allDays
      .filter((d: any) => d.habitId === h.id)
      .forEach((d: any) => {
        habitDayMap[d.date?.split("T")[0]] = d.status;
      });
    return Math.max(best, calculateStreak(habitDayMap));
  }, 0);

  const stats = [
    { label: "This week", value: `${weekPct}%`,        sub: "completion" },
    { label: "Habits",    value: `${habits.length}`,   sub: "tracked" },
    { label: "Today",     value: `${todayDone}`,       sub: "done today" },
    { label: "Streak",    value: `${bestStreak}d`,     sub: "best active" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ACCOUNT</Text>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>
          <View>
            <Text style={styles.emailText}>{email || "—"}</Text>
            <Text style={styles.memberText}>New Me member</Text>
          </View>
        </View>

        {/* Stat grid */}
        <View style={styles.statGrid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statSub}>{s.sub}</Text>
            </View>
          ))}

        </View>

        {/* This week's habit breakdown */}
        {habits.length > 0 && (
          <View style={styles.weekCard}>
            <Text style={styles.sectionLabel}>THIS WEEK</Text>
            {habits.map((h, i) => {
              const done = weekDates.filter(
                (d) => weekMap[h.id]?.[d] === "DONE",
              ).length;
              return (
                <View
                  key={h.id}
                  style={[
                    styles.habitRow,
                    i > 0 && styles.habitRowBorder,
                  ]}
                >
                  <Text style={styles.habitName}>{h.name}</Text>
                  <View style={styles.dotsRow}>
                    {weekDates.map((d, di) => {
                      const s = weekMap[h.id]?.[d] ?? "UNSET";
                      return (
                        <View
                          key={di}
                          style={[
                            styles.dot,
                            s === "DONE" && styles.dotDone,
                            s === "MISSED" && styles.dotMissed,
                          ]}
                        />
                      );
                    })}
                  </View>
                  <Text style={styles.doneCount}>{done}/7</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={logout}>
          <Text style={styles.signOutText}>Sign Out</Text>
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 12,
  },
  profileCard: {
    backgroundColor: "#085331",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: "600",
    color: "#98FF9D",
  },
  emailText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#98eaff",
  },
  memberText: {
    fontSize: 12,
    color: "#3a7a5a",
    marginTop: 2,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    backgroundColor: "#085331",
    borderRadius: 16,
    padding: 16,
    width: "47.5%",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 11,
    color: "#3a7a5a",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "400",
    color: "#98FF9D",
  },
  statSub: {
    fontSize: 11,
    color: "#3a7a5a",
    marginTop: 2,
  },
  weekCard: {
    backgroundColor: "#085331",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionLabel: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#3a7a5a",
  },
  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  habitRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(152,234,255,0.08)",
  },
  habitName: {
    flex: 1,
    fontSize: 14,
    color: "#98eaff",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#000",
  },
  dotDone: {
    backgroundColor: "#009951",
  },
  dotMissed: {
    backgroundColor: "#860000",
  },
  doneCount: {
    fontSize: 12,
    color: "#3a7a5a",
    width: 28,
    textAlign: "right",
  },
  signOutBtn: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.15)",
    marginTop: 4,
  },
  signOutText: {
    color: "#98eaff",
    fontSize: 14,
  },
});
