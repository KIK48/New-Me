import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/client";
import { syncScheduledNotifications, NotificationRule, Cadence } from "../utils/notifications";

const CADENCE_OPTIONS: { value: Cadence; label: string }[] = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "End of week" },
  { value: "MONTHLY", label: "End of month" },
  { value: "YEARLY", label: "End of year" },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = [0, 15, 30, 45];

function formatHourMinute(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${minute.toString().padStart(2, "0")} ${period}`;
}

function cadenceLabel(c: Cadence): string {
  const found = CADENCE_OPTIONS.find((o) => o.value === c);
  return found ? found.label : c;
}

interface Habit {
  id: string;
  name: string;
}

export default function NotificationSettingsScreen() {
  const { token, authorizedFetch } = useAuth();
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const [enabled, setEnabled] = useState(false);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [draftHabitId, setDraftHabitId] = useState<string | null>(null);
  const [draftCadence, setDraftCadence] = useState<Cadence>("DAILY");
  const [draftHour, setDraftHour] = useState(20);
  const [draftMinute, setDraftMinute] = useState(0);

  useEffect(() => {
    if (!token || !isFocused) return;
    setLoading(true);
    Promise.all([
      authorizedFetch(`${API_URL}/notifications`).then((r) => r.json()),
      authorizedFetch(`${API_URL}/habits`).then((r) => r.json()),
    ])
      .then(([notifData, habitsData]) => {
        setEnabled(notifData.enabled ?? false);
        setRules(Array.isArray(notifData.rules) ? notifData.rules : []);
        setHabits(Array.isArray(habitsData) ? habitsData : []);
      })
      .catch((err) => console.log("fetch error:", err))
      .finally(() => setLoading(false));
  }, [token, isFocused]);

  // Keep the on-device OS schedule in sync any time the master toggle or rule list changes
  useEffect(() => {
    if (loading) return;
    syncScheduledNotifications(enabled ? rules : []).catch((err) => console.log("sync error:", err));
  }, [enabled, rules, loading]);

  async function toggleMaster(next: boolean) {
    if (next) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Enable notifications for New Me in your device Settings first.");
        return;
      }
    }
    const prev = enabled;
    setEnabled(next);
    try {
      const res = await authorizedFetch(`${API_URL}/notifications/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setEnabled(prev);
      Alert.alert("Error", "Failed to update — try again");
    }
  }

  function openAddModal() {
    setEditingRule(null);
    setDraftHabitId(null);
    setDraftCadence("DAILY");
    setDraftHour(20);
    setDraftMinute(0);
    setModalVisible(true);
  }

  function openEditModal(rule: NotificationRule) {
    setEditingRule(rule);
    setDraftHabitId(rule.habitId);
    setDraftCadence(rule.cadence);
    setDraftHour(rule.hour);
    setDraftMinute(rule.minute);
    setModalVisible(true);
  }

  async function saveDraft() {
    const body = { habitId: draftHabitId, cadence: draftCadence, hour: draftHour, minute: draftMinute };
    try {
      if (editingRule) {
        const res = await authorizedFetch(`${API_URL}/notifications/rules/${editingRule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        const res = await authorizedFetch(`${API_URL}/notifications/rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setRules((prev) => [...prev, created]);
      }
      setModalVisible(false);
    } catch {
      Alert.alert("Error", "Failed to save — try again");
    }
  }

  function handleDelete(rule: NotificationRule) {
    Alert.alert("Remove Reminder", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const prev = rules;
          setRules((rs) => rs.filter((r) => r.id !== rule.id));
          try {
            const res = await authorizedFetch(`${API_URL}/notifications/rules/${rule.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
          } catch {
            setRules(prev);
            Alert.alert("Error", "Failed to delete — try again");
          }
        },
      },
    ]);
  }

  async function toggleRuleEnabled(rule: NotificationRule) {
    const prev = rules;
    setRules((rs) => rs.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r)));
    try {
      const res = await authorizedFetch(`${API_URL}/notifications/rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setRules(prev);
      Alert.alert("Error", "Failed to update — try again");
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.eyebrow}>SETTINGS</Text>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.masterRow}>
          <View>
            <Text style={styles.masterLabel}>Enable Notifications</Text>
            <Text style={styles.masterSub}>{enabled ? "On" : "Off"}</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, enabled && styles.toggleOn]}
            onPress={() => toggleMaster(!enabled)}
          >
            <View style={[styles.toggleThumb, enabled && styles.toggleThumbOn]} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>REMINDERS</Text>

        {loading ? (
          <ActivityIndicator color="#98FF9D" />
        ) : rules.length === 0 ? (
          <Text style={styles.emptyText}>No reminders yet — add one below.</Text>
        ) : (
          rules.map((rule) => (
            <TouchableOpacity key={rule.id} style={styles.ruleCard} onPress={() => openEditModal(rule)}>
              <View style={styles.ruleInfo}>
                <Text style={styles.ruleName}>{rule.habit?.name ?? "General reminder"}</Text>
                <Text style={styles.ruleSub}>
                  {cadenceLabel(rule.cadence)} · {formatHourMinute(rule.hour, rule.minute)}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.smallToggle, rule.enabled && styles.smallToggleOn]}
                onPress={() => toggleRuleEnabled(rule)}
              >
                <View style={[styles.smallToggleThumb, rule.enabled && styles.smallToggleThumbOn]} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(rule)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Add Reminder</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalRoot}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.card}>
            <View style={styles.handle} />
            <Text style={styles.eyebrow}>{editingRule ? "EDIT REMINDER" : "NEW REMINDER"}</Text>

            <Text style={styles.fieldLabel}>HABIT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              <TouchableOpacity
                style={[styles.pillBtn, draftHabitId === null && styles.pillBtnActive]}
                onPress={() => setDraftHabitId(null)}
              >
                <Text style={[styles.pillText, draftHabitId === null && styles.pillTextActive]}>General</Text>
              </TouchableOpacity>
              {habits.map((h) => (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.pillBtn, draftHabitId === h.id && styles.pillBtnActive]}
                  onPress={() => setDraftHabitId(h.id)}
                >
                  <Text
                    style={[styles.pillText, draftHabitId === h.id && styles.pillTextActive]}
                    numberOfLines={1}
                  >
                    {h.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>FREQUENCY</Text>
            <View style={styles.freqRow}>
              {CADENCE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.freqBtn, draftCadence === opt.value && styles.freqBtnActive]}
                  onPress={() => setDraftCadence(opt.value)}
                >
                  <Text style={[styles.freqBtnText, draftCadence === opt.value && styles.freqBtnTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>TIME</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              {HOUR_OPTIONS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.timeBtn, draftHour === h && styles.timeBtnActive]}
                  onPress={() => setDraftHour(h)}
                >
                  <Text style={[styles.timeBtnText, draftHour === h && styles.timeBtnTextActive]}>
                    {h % 12 === 0 ? 12 : h % 12}
                    {h >= 12 ? "PM" : "AM"}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              {MINUTE_OPTIONS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.timeBtn, draftMinute === m && styles.timeBtnActive]}
                  onPress={() => setDraftMinute(m)}
                >
                  <Text style={[styles.timeBtnText, draftMinute === m && styles.timeBtnTextActive]}>
                    :{m.toString().padStart(2, "0")}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={saveDraft}>
              <Text style={styles.saveBtnText}>{editingRule ? "Save Changes" : "Add Reminder"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000603", paddingTop: 60 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { marginBottom: 12 },
  backText: { color: "#3a7a5a", fontSize: 16 },
  eyebrow: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#3a7a5a",
    marginBottom: 2,
  },
  title: { fontSize: 28, fontWeight: "400", color: "#98eaff" },
  content: { paddingHorizontal: 20, paddingBottom: 110, gap: 12 },
  masterRow: {
    backgroundColor: "#085331",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  masterLabel: { fontSize: 16, color: "#98eaff" },
  masterSub: { fontSize: 12, color: "#3a7a5a", marginTop: 2 },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#000",
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.15)",
  },
  toggleOn: { backgroundColor: "#009951", borderColor: "#009951" },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3a7a5a",
  },
  toggleThumbOn: { backgroundColor: "#fff", alignSelf: "flex-end" },
  sectionLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#3a7a5a",
    marginTop: 4,
  },
  emptyText: { fontSize: 13, color: "#3a7a5a" },
  ruleCard: {
    backgroundColor: "#085331",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  ruleInfo: { flex: 1 },
  ruleName: { fontSize: 15, color: "#98eaff" },
  ruleSub: { fontSize: 12, color: "#3a7a5a", marginTop: 2 },
  smallToggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#000",
    padding: 2,
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.15)",
  },
  smallToggleOn: { backgroundColor: "#009951", borderColor: "#009951" },
  smallToggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#3a7a5a",
  },
  smallToggleThumbOn: { backgroundColor: "#fff", alignSelf: "flex-end" },
  removeText: { fontSize: 12, color: "rgba(255,85,85,0.7)" },
  addBtn: {
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(152,255,157,0.25)",
    borderStyle: "dashed",
  },
  addBtnText: { fontSize: 14, color: "#98FF9D" },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  card: {
    backgroundColor: "#05170e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(152, 255, 157, 0.15)",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3a7a5a",
    alignSelf: "center",
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#3a7a5a",
    marginBottom: 8,
    marginTop: 16,
  },
  pillRow: { gap: 8, paddingVertical: 2 },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.15)",
    backgroundColor: "#001b0e",
    maxWidth: 140,
  },
  pillBtnActive: { backgroundColor: "#085331", borderColor: "#009951" },
  pillText: { fontSize: 13, color: "#3a7a5a" },
  pillTextActive: { color: "#98FF9D", fontWeight: "600" },
  freqRow: { flexDirection: "row", gap: 8 },
  freqBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.15)",
    backgroundColor: "#001b0e",
    alignItems: "center",
  },
  freqBtnActive: { backgroundColor: "#085331", borderColor: "#009951" },
  freqBtnText: { fontSize: 11, color: "#3a7a5a", textAlign: "center" },
  freqBtnTextActive: { color: "#98FF9D", fontWeight: "600" },
  timeBtn: {
    width: 56,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.15)",
    backgroundColor: "#001b0e",
    alignItems: "center",
  },
  timeBtnActive: { backgroundColor: "#085331", borderColor: "#009951" },
  timeBtnText: { fontSize: 13, color: "#3a7a5a" },
  timeBtnTextActive: { color: "#98FF9D", fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#009951",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cancelBtn: { alignSelf: "center", padding: 8 },
  cancelBtnText: { color: "#3a7a5a", fontSize: 14 },
});
