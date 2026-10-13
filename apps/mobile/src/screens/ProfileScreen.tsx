import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/client";
import { AppStack } from "../navigation/types";
import {
  todayISO,
  getMondayISO,
  buildWeekDates,
} from "../utils/dates";
import { calculateStreak } from "../utils/streak";
import { BORDER } from "../theme";
import SlideInView from "../components/SlideInView";

type DayStatus = "UNSET" | "DONE" | "MISSED";
type Nav = NativeStackNavigationProp<AppStack>;

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
  const { token, logout, authorizedFetch } = useAuth();
  const navigation = useNavigation<Nav>();
  const [habits, setHabits] = useState<any[]>([]);
  const [allDays, setAllDays] = useState<any[]>([]);

  const email = useMemo(
    () => (token ? getEmailFromToken(token) : ""),
    [token],
  );
  const avatarLetter = email ? email[0].toUpperCase() : "?";
  const [deleting, setDeleting] = useState(false);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!token || !isFocused) return;
    Promise.all([
      authorizedFetch(`${API_URL}/habits`).then((r) => r.json()),
      authorizedFetch(`${API_URL}/habit-days`).then((r) => r.json()),
    ])
      .then(([habitsData, daysData]) => {
        setHabits(Array.isArray(habitsData) ? habitsData : []);
        setAllDays(Array.isArray(daysData) ? daysData : []);
      })
      .catch(console.error);
  }, [token, isFocused]);

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

  // Best current streak across all habits — track name too
  const bestStreakInfo = habits.reduce(
    (best, h) => {
      const habitDayMap: Record<string, "DONE" | "MISSED" | "UNSET"> = {};
      allDays
        .filter((d: any) => d.habitId === h.id)
        .forEach((d: any) => {
          habitDayMap[d.date?.split("T")[0]] = d.status;
        });
      const s = calculateStreak(habitDayMap, {
        type: h.frequencyType ?? "DAILY",
        count: h.frequencyCount ?? 1,
      });
      return s > best.streak ? { streak: s, name: h.name } : best;
    },
    { streak: 0, name: "" },
  );

  // Play/App Store policy requires an in-app way to delete an account, not
  // just uninstalling. Confirmed destructively since it's irreversible —
  // the API cascades the delete through habits, days, logs, and tokens.
  function confirmDeleteAccount() {
    Alert.alert(
      "Delete account",
      "This permanently deletes your account and all your habit data. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteAccount },
      ],
    );
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      const res = await authorizedFetch(`${API_URL}/auth/account`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await logout();
    } catch {
      Alert.alert("Something went wrong", "Couldn't delete your account. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  const stats = [
    { label: "This week", value: `${weekPct}%`,                  sub: "completion" },
    { label: "Habits",    value: `${habits.length}`,             sub: "tracked" },
    { label: "Today",     value: `${todayDone}`,                 sub: "done today" },
    { label: "Streak",    value: `${bestStreakInfo.streak}d`,    sub: bestStreakInfo.name || "best active" },
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
          <View style={styles.profileTextCol}>
            <Text style={styles.emailText} numberOfLines={1} ellipsizeMode="tail">
              {email || "—"}
            </Text>
            <Text style={styles.memberText}>New Me member</Text>
          </View>
        </View>

        {/* Stat grid */}
        <View style={styles.statGrid}>
          {stats.map((s, i) => (
            <SlideInView key={s.label} index={i} style={styles.statSlot}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statSub}>{s.sub}</Text>
              </View>
            </SlideInView>
          ))}

        </View>

        {/* This week's habit breakdown */}
        {habits.length > 0 && (
          <SlideInView index={stats.length}>
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
          </SlideInView>
        )}

        {/* Notification settings */}
        <SlideInView index={stats.length + 1}>
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => navigation.navigate("NotificationSettings")}
          >
            <Text style={styles.settingsRowText}>Notifications</Text>
            <Text style={styles.settingsRowChevron}>›</Text>
          </TouchableOpacity>
        </SlideInView>

        {/* Sign out */}
        <SlideInView index={stats.length + 2}>
          <TouchableOpacity style={styles.signOutBtn} onPress={logout}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </SlideInView>

        {/* Delete account */}
        <SlideInView index={stats.length + 3}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={confirmDeleteAccount}
            disabled={deleting}
          >
            <Text style={styles.deleteText}>
              {deleting ? "Deleting…" : "Delete Account"}
            </Text>
          </TouchableOpacity>
        </SlideInView>
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
    borderWidth: 1,
    borderColor: BORDER,
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
  profileTextCol: {
    flex: 1,
    minWidth: 0, // lets emailText's numberOfLines truncation actually kick in instead of overflowing the row
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
  statSlot: {
    width: "47.5%",
  },
  statCard: {
    backgroundColor: "#085331",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 16,
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
    borderWidth: 1,
    borderColor: BORDER,
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
  // Full-width card row so navigation (Notifications) reads differently from the
  // account actions (Sign Out / Delete) below it
  settingsRow: {
    backgroundColor: "#085331",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsRowText: {
    color: "#98eaff",
    fontSize: 15,
  },
  settingsRowChevron: {
    color: "#98FF9D",
    fontSize: 22,
    lineHeight: 24,
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
  deleteBtn: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(134,0,0,0.4)",
    marginTop: 4,
  },
  // #860000 is the danger *fill* color; as text on near-black it's too dim to read
  deleteText: {
    color: "#ff5555",
    fontSize: 14,
  },
});
