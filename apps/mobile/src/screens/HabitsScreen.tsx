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

type Nav = NativeStackNavigationProp<AppStack, "Habits">;

type DayStatus = "UNSET" | "DONE" | "MISSED";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function nextStatus(current: DayStatus): DayStatus {
  if (current === "UNSET") return "DONE";
  if (current === "DONE") return "MISSED";
  return "UNSET";
}

export default function HabitsScreen() {
  const { token, logout } = useAuth();
  const navigation = useNavigation<Nav>();
  const [habits, setHabits] = useState<any[]>([]);
  const [deleteMode, setDeleteMode] = useState(false);
  // Maps habitId -> today's status
  const [todayStatuses, setTodayStatuses] = useState<Record<string, DayStatus>>({});

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

  function statusStyle(status: DayStatus) {
    if (status === "DONE") return [styles.statusBtn, styles.statusDone];
    if (status === "MISSED") return [styles.statusBtn, styles.statusMissed];
    return [styles.statusBtn, styles.statusUnset];
  }

  function statusLabel(status: DayStatus) {
    if (status === "DONE") return "✓";
    if (status === "MISSED") return "✗";
    return "";
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Habbits</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate("CreateHabit")}
            style={styles.addBtn}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (deleteMode) setDeleteMode(false);
              else setDeleteMode(true);
            }}
            style={styles.addBtn}
          >
            <Text style={styles.addBtnText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout}>
            <Text style={styles.logout}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const status = todayStatuses[item.id] ?? "UNSET";
          return (
            <View style={styles.habit}>
              <TouchableOpacity
                style={statusStyle(status)}
                onPress={() => handleCheckIn(item.id)}
              >
                <Text style={styles.statusLabel}>{statusLabel(status)}</Text>
              </TouchableOpacity>
              <Text style={styles.habitName}>{item.name}</Text>
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
                  <Text style={styles.editBtn}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() =>
                    Alert.alert("Removing", "Are you sure you want to remove?", [
                      { text: "Cancel" },
                      {
                        text: "Delete",
                        onPress: async () => {
                          try {
                            const res = await fetch(
                              `${API_URL}/habits/${item.id}`,
                              {
                                method: "DELETE",
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                },
                              },
                            );
                            if (!res.ok) {
                              const body = await res.json();
                              Alert.alert(
                                "Error",
                                body.error ?? "Failed to delete habit",
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
                  <Text style={styles.editBtn}>X</Text>
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
  container: { flex: 1, padding: 24, paddingTop: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: "bold" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontSize: 24, lineHeight: 28 },
  logout: { color: "#888", fontSize: 14 },
  habit: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  habitName: { fontSize: 16, flex: 1 },
  editBtn: { color: "#888", fontSize: 14 },
  statusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statusUnset: { borderWidth: 2, borderColor: "#ddd" },
  statusDone: { backgroundColor: "#22c55e" },
  statusMissed: { backgroundColor: "#ef4444" },
  statusLabel: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
