import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import React, { useState, useCallback } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { AppStack } from "../navigation/types";
import { API_URL } from "../api/client";
import { todayISO } from "../utils/dates";
import { CheckIcon, XIcon } from "../components/HabitIcons";

// HabitsScreen lives inside the tab navigator, but CreateHabit/EditHabit
// are on the parent AppStack — useNavigation gives access to the full stack
type Nav = NativeStackNavigationProp<AppStack>;

type DayStatus = "UNSET" | "DONE" | "MISSED";

function nextStatus(current: DayStatus): DayStatus {
  if (current === "UNSET") return "DONE";
  if (current === "DONE") return "MISSED";
  return "UNSET";
}

export default function HabitsScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<Nav>();
  const [habits, setHabits] = useState<any[]>([]);
  const [deleteMode, setDeleteMode] = useState(false);
  // Maps habitId -> today's status
  const [todayStatuses, setTodayStatuses] = useState<Record<string, DayStatus>>(
    {},
  );

  // Refetch every time this screen comes into focus (e.g. returning from CreateHabit)
  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      const today = todayISO();

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

          // Build a map of habitId -> status for today only
          const map: Record<string, DayStatus> = {};
          if (Array.isArray(daysData)) {
            daysData
              .filter((d: any) => d.date?.startsWith(today))
              .forEach((d: any) => {
                map[d.habitId] = d.status as DayStatus;
              });
          }
          setTodayStatuses(map);
        })
        .catch((err) => console.log("fetch error:", err));
    }, [token]),
  );

  async function handleCheckIn(habitId: string) {
    const current = todayStatuses[habitId] ?? "UNSET";
    const next = nextStatus(current);
    const today = todayISO();

    // Optimistic update — update UI immediately, don't wait for server
    setTodayStatuses((prev) => ({ ...prev, [habitId]: next }));

    try {
      const res = await fetch(`${API_URL}/habit-days`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ habitId, date: today, status: next }),
      });
      if (!res.ok) {
        // Roll back on failure
        setTodayStatuses((prev) => ({ ...prev, [habitId]: current }));
        Alert.alert("Error", "Failed to save check-in");
      }
    } catch {
      setTodayStatuses((prev) => ({ ...prev, [habitId]: current }));
      Alert.alert("Error", "Network error — try again");
    }
  }

  const done = habits.filter((h) => todayStatuses[h.id] === "DONE").length;
  const pct = habits.length > 0 ? Math.round((done / habits.length) * 100) : 0;
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>TODAY</Text>
          <Text style={styles.title}>Home</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate("CreateHabit")}
          >
            <Text style={styles.iconBtnText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, deleteMode && styles.iconBtnDanger]}
            onPress={() => setDeleteMode(!deleteMode)}
          >
            <Text
              style={[
                styles.iconBtnText,
                deleteMode && styles.iconBtnTextDanger,
              ]}
            >
              −
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress card */}
      <View style={styles.progressCard}>
        <Text style={styles.progressDate}>{todayLabel}</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
          </View>
          <Text style={styles.progressCount}>
            {done}/{habits.length}
          </Text>
        </View>
      </View>

      {/* Habit list */}
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const status = todayStatuses[item.id] ?? "UNSET";
          const nameColor =
            status === "DONE"
              ? "#98FF9D"
              : status === "MISSED"
                ? "#ff5555"
                : "#98eaff";
          const subtext =
            status === "DONE"
              ? "Completed"
              : status === "MISSED"
                ? "Missed"
                : "Tap to mark done";

          return (
            <View style={styles.habitCard}>
              <TouchableOpacity
                style={styles.statusIcon}
                onPress={() => handleCheckIn(item.id)}
              >
                {status === "DONE" && <CheckIcon size={40} />}
                {status === "MISSED" && <XIcon size={40} />}
              </TouchableOpacity>
              <View style={styles.habitInfo}>
                <Text
                  style={[
                    styles.habitName,
                    {
                      color: nameColor,
                      textDecorationLine:
                        status === "MISSED" ? "line-through" : "none",
                    },
                  ]}
                >
                  {item.name}
                </Text>
                <Text style={styles.habitSub}>{subtext}</Text>
              </View>
              {!deleteMode ? (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("EditHabit", {
                      id: item.id,
                      name: item.name,
                      notes: item.notes,
                    })
                  }
                >
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert("Remove Habit", "Are you sure?", [
                      { text: "Cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            const res = await fetch(
                              `${API_URL}/habits/${item.id}`,
                              {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                              },
                            );
                            if (!res.ok) {
                              const body = await res.json();
                              Alert.alert(
                                "Error",
                                body.error ?? "Failed to delete",
                              );
                              return;
                            }
                            setHabits(habits.filter((h) => h.id !== item.id));
                          } catch {
                            Alert.alert("Error", "Network error — try again");
                          }
                        },
                      },
                    ])
                  }
                >
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    color: "#98eaff",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#085331",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.12)",
  },
  iconBtnDanger: {
    backgroundColor: "rgba(134,0,0,0.4)",
    borderColor: "rgba(255,85,85,0.3)",
  },
  iconBtnText: {
    color: "#98eaff",
    fontSize: 22,
    lineHeight: 26,
  },
  iconBtnTextDanger: {
    color: "#ff5555",
  },
  progressCard: {
    backgroundColor: "#085331",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  progressDate: {
    fontSize: 15,
    color: "#98eaff",
    marginBottom: 10,
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
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 10,
  },
  habitCard: {
    backgroundColor: "#085331",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.1)",
    flexShrink: 0,
  },
  statusIconLabel: {
    fontSize: 20,
    fontWeight: "bold",
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 17,
    fontWeight: "400",
  },
  habitSub: {
    fontSize: 12,
    color: "#3a7a5a",
    marginTop: 2,
  },
  editText: {
    fontSize: 13,
    color: "rgba(152,234,255,0.4)",
  },
  deleteText: {
    fontSize: 16,
    color: "#ff5555",
  },
});
