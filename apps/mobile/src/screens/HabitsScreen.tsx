import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import React, { useState, useEffect } from "react";
import { useIsFocused, useNavigation } from "@react-navigation/native";
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
type Mode = "+" | "-" | null;


export default function HabitsScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<Nav>();
  const [habits, setHabits] = useState<any[]>([]);
  const [todayStatuses, setTodayStatuses] = useState<Record<string, DayStatus>>({});
  // +/- mode: tap a habit card to mark done (+) or undo (-)
  const [mode, setMode] = useState<Mode>(null);

  const isFocused = useIsFocused();

  // Refetch when token loads OR screen gains focus.
  // useIsFocused + useEffect handles both: navigation events AND app restarts where
  // the screen is already focused when the token loads from SecureStore.
  useEffect(() => {
    if (!token || !isFocused) return;
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
  }, [token, isFocused]);

  async function updateStatus(habitId: string, next: DayStatus) {
    const current = todayStatuses[habitId] ?? "UNSET";
    const today = todayISO();

    // Optimistic update
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
        setTodayStatuses((prev) => ({ ...prev, [habitId]: current }));
        Alert.alert("Error", "Failed to save check-in");
      }
    } catch {
      setTodayStatuses((prev) => ({ ...prev, [habitId]: current }));
      Alert.alert("Error", "Network error — try again");
    }
  }

  function handleCardPress(habitId: string) {
    if (mode === "+") {
      updateStatus(habitId, "DONE");
    } else if (mode === "-") {
      updateStatus(habitId, "UNSET");
    } else {
      // Default: toggle done on status icon tap
      const current = todayStatuses[habitId] ?? "UNSET";
      updateStatus(habitId, current === "DONE" ? "UNSET" : "DONE");
    }
  }

  function handleToggleMissed(habitId: string) {
    const current = todayStatuses[habitId] ?? "UNSET";
    updateStatus(habitId, current === "MISSED" ? "UNSET" : "MISSED");
  }

  function handleDelete(habitId: string) {
    Alert.alert("Remove Habit", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/habits/${habitId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
              const body = await res.json();
              Alert.alert("Error", body.error ?? "Failed to delete");
              return;
            }
            setHabits((prev) => prev.filter((h) => h.id !== habitId));
          } catch {
            Alert.alert("Error", "Network error — try again");
          }
        },
      },
    ]);
  }

  function toggleMode(next: Mode) {
    setMode((prev) => (prev === next ? null : next));
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
            style={[styles.modeBtn, mode === "+" && styles.modeBtnPlus]}
            onPress={() => toggleMode("+")}
          >
            <Text style={[styles.modeBtnText, mode === "+" && styles.modeBtnTextPlus]}>
              +
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "-" && styles.modeBtnMinus]}
            onPress={() => toggleMode("-")}
          >
            <Text style={[styles.modeBtnText, mode === "-" && styles.modeBtnTextMinus]}>
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
        ListFooterComponent={
          <TouchableOpacity
            style={styles.skeletonCard}
            onPress={() => navigation.navigate("CreateHabit")}
          >
            <Text style={styles.skeletonPlus}>+</Text>
            <Text style={styles.skeletonText}>Add new habit</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => {
          const status = todayStatuses[item.id] ?? "UNSET";
          const nameColor =
            status === "DONE"
              ? "#98FF9D"
              : status === "MISSED"
                ? "#ff5555"
                : "#98eaff";
          const subtext =
            mode === "+"
              ? "Tap to mark done"
              : mode === "-"
                ? "Tap to undo"
                : status === "DONE"
                  ? "Completed"
                  : status === "MISSED"
                    ? "Missed"
                    : "Tap to mark done";

          return (
            <Swipeable
              renderRightActions={() => (
                <TouchableOpacity
                  style={swipeDeleteBtn}
                  onPress={() => handleDelete(item.id)}
                >
                  <Text style={swipeDeleteText}>Delete</Text>
                </TouchableOpacity>
              )}
            >
              <TouchableOpacity
                style={styles.habitCard}
                onPress={() => handleCardPress(item.id)}
                activeOpacity={mode ? 0.6 : 1}
              >
                <View
                  style={[
                    styles.statusIcon,
                    status === "DONE" && styles.statusIconDone,
                    status === "MISSED" && styles.statusIconMissed,
                  ]}
                >
                  {status === "DONE" && <CheckIcon size={40} />}
                  {status === "MISSED" && <XIcon size={40} />}
                </View>
                <TouchableOpacity
                  style={styles.habitInfo}
                  onPress={() =>
                    mode
                      ? handleCardPress(item.id)
                      : navigation.navigate("HabitDetail", {
                          id: item.id,
                          name: item.name,
                          notes: item.notes,
                          frequency: {
                            type: item.frequencyType ?? "DAILY",
                            count: item.frequencyCount ?? 1,
                          },
                        })
                  }
                >
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
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.missedBtn,
                    status === "MISSED" && styles.missedBtnActive,
                  ]}
                  onPress={() => handleToggleMissed(item.id)}
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
            </Swipeable>
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
    gap: 10,
  },
  modeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#085331",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.12)",
  },
  modeBtnPlus: {
    backgroundColor: "rgba(0,153,81,0.3)",
    borderColor: "#009951",
  },
  modeBtnMinus: {
    backgroundColor: "rgba(134,0,0,0.3)",
    borderColor: "#860000",
  },
  modeBtnText: {
    color: "#3a7a5a",
    fontSize: 22,
    lineHeight: 26,
  },
  modeBtnTextPlus: {
    color: "#98FF9D",
  },
  modeBtnTextMinus: {
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
  statusIconDone: {
    borderColor: "#009951",
  },
  statusIconMissed: {
    borderColor: "#860000",
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
    fontSize: 12,
    color: "rgba(255,85,85,0.5)",
  },
  missedBtnTextActive: {
    color: "#ff5555",
  },
  skeletonCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(152,255,157,0.25)",
    borderStyle: "dashed",
  },
  skeletonPlus: {
    fontSize: 22,
    color: "#98FF9D",
    lineHeight: 26,
  },
  skeletonText: {
    fontSize: 15,
    color: "#98FF9D",
  },
});

const swipeDeleteBtn = {
  backgroundColor: "#860000",
  justifyContent: "center" as const,
  alignItems: "center" as const,
  paddingHorizontal: 24,
  borderRadius: 16,
  marginLeft: 8,
};

const swipeDeleteText = {
  color: "#fff",
  fontSize: 13,
  fontWeight: "600" as const,
};
