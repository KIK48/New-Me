import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  RefreshControl,
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
import AnimatedProgressBar from "../components/AnimatedProgressBar";
import MultiCountHabitCard from "../components/MultiCountHabitCard";
import { localDateOf } from "../utils/dates";
import { countInPeriod, dayCounts, periodWord, usesLogs } from "../utils/periods";
import { BORDER, BORDER_DONE, BORDER_MISSED } from "../theme";
import { slideIn } from "../components/SlideInView";

// HabitsScreen lives inside the tab navigator, but CreateHabit/EditHabit
// are on the parent AppStack — useNavigation gives access to the full stack
type Nav = NativeStackNavigationProp<AppStack>;
type DayStatus = "UNSET" | "DONE" | "MISSED";
type Mode = "+" | "-" | null;
interface HabitLogEntry {
  id: string;
  habitId: string;
  loggedAt: string;
}


export default function HabitsScreen() {
  const { token, authorizedFetch } = useAuth();
  const navigation = useNavigation<Nav>();
  const [habits, setHabits] = useState<any[]>([]);
  // Full history (habitId -> date -> status), not just today: weekly/monthly/yearly
  // habits need their whole period to show "1/2 this week", and it keeps Home
  // reading the same HabitDay data the Calendar writes.
  const [allStatuses, setAllStatuses] = useState<Record<string, Record<string, DayStatus>>>({});
  const [logs, setLogs] = useState<HabitLogEntry[]>([]);
  const [loaded, setLoaded] = useState(false); // gates the empty state so it doesn't flash before data arrives
  const [refreshing, setRefreshing] = useState(false);
  const todayStatuses: Record<string, DayStatus> = {};
  Object.keys(allStatuses).forEach((id) => {
    todayStatuses[id] = allStatuses[id]?.[todayISO()] ?? "UNSET";
  });

  // One persistent Animated.Value per habit card, keyed by id, so the scale
  // bounce survives re-renders (status toggles) instead of resetting mid-animation.
  const cardScales = React.useRef<Record<string, Animated.Value>>({}).current;
  function getCardScale(id: string) {
    if (!cardScales[id]) cardScales[id] = new Animated.Value(1);
    return cardScales[id];
  }
  function bounceCard(id: string, toValue: number) {
    Animated.spring(getCardScale(id), {
      toValue,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  }
  // +/- mode: tap a habit card to mark done (+) or undo (-)
  const [mode, setMode] = useState<Mode>(null);

  const isFocused = useIsFocused();

  // Refetch when token loads OR screen gains focus.
  // useIsFocused + useEffect handles both: navigation events AND app restarts where
  // the screen is already focused when the token loads from SecureStore.
  function loadData() {
    return Promise.all([
      authorizedFetch(`${API_URL}/habits`).then((r) => r.json()),
      authorizedFetch(`${API_URL}/habit-days`).then((r) => r.json()),
      authorizedFetch(`${API_URL}/habit-logs`).then((r) => r.json()),
    ])
      .then(([habitsData, daysData, logsData]) => {
        setHabits(Array.isArray(habitsData) ? habitsData : []);

        const map: Record<string, Record<string, DayStatus>> = {};
        if (Array.isArray(daysData)) {
          daysData.forEach((d: any) => {
            const dayStr = d.date?.split("T")[0];
            if (!map[d.habitId]) map[d.habitId] = {};
            map[d.habitId][dayStr] = d.status as DayStatus;
          });
        }
        setAllStatuses(map);
        setLogs(Array.isArray(logsData) ? logsData : []);
      })
      .catch((err) => console.log("fetch error:", err))
      // Even a failed first fetch counts as "loaded" — otherwise a flaky network
      // would leave the list stuck with no empty state or retry hint
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    if (!token || !isFocused) return;
    loadData();
  }, [token, isFocused]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  // Completions in the habit's current period (today / this week / month / year),
  // counting both logs and legacy checkmarks — the same number the Calendar shows.
  function periodCount(h: any): number {
    return countInPeriod(dayCounts(h.id, logs, allStatuses[h.id]), h.frequencyType, todayISO());
  }

  function logsForHabitToday(habitId: string) {
    const today = todayISO();
    return logs.filter((l) => l.habitId === habitId && localDateOf(l.loggedAt) === today);
  }

  async function addLog(habitId: string) {
    const tempId = `temp-${Date.now()}`;
    const optimisticLog: HabitLogEntry = { id: tempId, habitId, loggedAt: new Date().toISOString() };
    setLogs((prev) => [optimisticLog, ...prev]);

    try {
      const res = await authorizedFetch(`${API_URL}/habit-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId }),
      });
      if (!res.ok) throw new Error("Failed to log");
      const saved = await res.json();
      setLogs((prev) => prev.map((l) => (l.id === tempId ? saved : l)));
    } catch {
      setLogs((prev) => prev.filter((l) => l.id !== tempId));
      Alert.alert("Error", "Failed to save — try again");
    }
  }

  async function deleteLog(logId: string) {
    const removed = logs.find((l) => l.id === logId);
    setLogs((prev) => prev.filter((l) => l.id !== logId));

    try {
      const res = await authorizedFetch(`${API_URL}/habit-logs/${logId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    } catch {
      if (removed) setLogs((prev) => [removed, ...prev]);
      Alert.alert("Error", "Failed to undo — try again");
    }
  }

  async function updateStatus(habitId: string, next: DayStatus) {
    const current = todayStatuses[habitId] ?? "UNSET";
    const today = todayISO();

    const setToday = (status: DayStatus) =>
      setAllStatuses((prev) => ({ ...prev, [habitId]: { ...(prev[habitId] ?? {}), [today]: status } }));

    // Optimistic update
    setToday(next);

    try {
      const res = await authorizedFetch(`${API_URL}/habit-days`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date: today, status: next }),
      });
      if (!res.ok) {
        setToday(current);
        Alert.alert("Error", "Failed to save check-in");
      }
    } catch {
      setToday(current);
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
            const res = await authorizedFetch(`${API_URL}/habits/${habitId}`, {
              method: "DELETE",
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

  // A multi-count habit (target > 1) contributes partial credit — e.g. 1 of 2
  // logs is worth 0.5 of a habit — instead of only counting once fully done.
  function completionFraction(h: any): number {
    const target = h.frequencyCount ?? 1;
    // Judged on the habit's whole period ("1/2 this week"), the same count the
    // Calendar shows, so both screens always agree.
    return Math.min(periodCount(h) / target, 1);
  }

  const fractionalDone = habits.reduce((sum, h) => sum + completionFraction(h), 0);
  const pct = habits.length > 0 ? Math.round((fractionalDone / habits.length) * 100) : 0;
  const done = habits.filter((h) => completionFraction(h) >= 1).length;
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

      {/* Habit list */}
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#98FF9D"
          />
        }
        ListHeaderComponent={
          loaded && habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No habits yet</Text>
              <Text style={styles.emptyText}>
                Start with one small thing you want to do every day. You can add more later.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <TouchableOpacity
            style={styles.skeletonCard}
            onPress={() => navigation.navigate("CreateHabit")}
          >
            <Text style={styles.skeletonPlus}>+</Text>
            <Text style={styles.skeletonText}>Add new habit</Text>
          </TouchableOpacity>
        }
        renderItem={({ item, index }) =>
          slideIn(index, () => {
          const target = item.frequencyCount ?? 1;

          if (usesLogs(item.frequencyType, target)) {
            const dayLogs = logsForHabitToday(item.id).sort((a, b) =>
              a.loggedAt < b.loggedAt ? 1 : -1,
            );
            const isMissed = todayStatuses[item.id] === "MISSED";

            return (
              <Swipeable
                renderRightActions={() => (
                  <TouchableOpacity style={swipeDeleteBtn} onPress={() => handleDelete(item.id)}>
                    <Text style={swipeDeleteText}>Delete</Text>
                  </TouchableOpacity>
                )}
              >
                <MultiCountHabitCard
                  name={item.name}
                  count={periodCount(item)}
                  target={target}
                  periodLabel={(item.frequencyType ?? "DAILY") !== "DAILY" ? periodWord(item.frequencyType) : undefined}
                  canLog
                  isMissed={isMissed}
                  logs={dayLogs}
                  onAddLog={() => addLog(item.id)}
                  onDeleteLog={deleteLog}
                  onToggleMissed={() => updateStatus(item.id, isMissed ? "UNSET" : "MISSED")}
                />
              </Swipeable>
            );
          }

          const status = todayStatuses[item.id] ?? "UNSET";
          const nameColor =
            status === "DONE"
              ? "#98FF9D"
              : status === "MISSED"
                ? "#ff5555"
                : "#98eaff";
          const isPeriodHabit = (item.frequencyType ?? "DAILY") !== "DAILY";
          const periodDone = isPeriodHabit ? periodCount(item) : 0;
          const baseSubtext =
            mode === "+"
              ? "Tap to mark done"
              : mode === "-"
                ? "Tap to undo"
                : status === "DONE"
                  ? "Completed"
                  : status === "MISSED"
                    ? "Missed"
                    : "Tap to mark done";
          // e.g. "Completed · 1/2 this week" so the period progress is visible on Home
          const subtext = isPeriodHabit
            ? `${baseSubtext} · ${periodDone}/${target} ${periodWord(item.frequencyType)}`
            : baseSubtext;

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
              <Animated.View
                style={{ transform: [{ scale: getCardScale(item.id) }] }}
              >
                <TouchableOpacity
                  style={[styles.habitCard, status === "MISSED" && styles.cardMissed, status === "DONE" && styles.cardDone]}
                  onPress={() => handleCardPress(item.id)}
                  onPressIn={() => bounceCard(item.id, 0.97)}
                  onPressOut={() => bounceCard(item.id, 1)}
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
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => handleToggleMissed(item.id)}
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
              </Animated.View>
            </Swipeable>
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
    borderWidth: 1,
    borderColor: BORDER,
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
    borderWidth: 1,
    borderColor: BORDER,
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
  emptyState: {
    paddingVertical: 24,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 17,
    color: "#98eaff",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: "#3a7a5a",
    textAlign: "center",
    lineHeight: 20,
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
