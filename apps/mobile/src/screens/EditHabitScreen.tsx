import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStack, Frequency } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/client";

type Props = NativeStackScreenProps<AppStack, "EditHabit">;

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "DAILY",          label: "Daily" },
  { value: "WEEKDAYS",       label: "Weekdays" },
  { value: "THREE_PER_WEEK", label: "3×/wk" },
  { value: "TWO_PER_WEEK",   label: "2×/wk" },
];

export default function EditHabitScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const { id, name: initialName, notes: initialNotes, frequency: initialFrequency } = route.params;
  const [name, setName] = useState(initialName);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [frequency, setFrequency] = useState<Frequency>(initialFrequency);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/habits/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          notes: notes.trim() || null,
          frequency,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        Alert.alert("Error", body.error ?? "Failed to update habit");
        return;
      }
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.eyebrow}>EDIT HABIT</Text>
        <Text style={styles.title}>Update your habit</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.fieldLabel}>NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Habit name"
          placeholderTextColor="#3a7a5a"
          autoFocus
          returnKeyType="next"
          maxLength={80}
        />

        <Text style={styles.fieldLabel}>NOTES</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes"
          placeholderTextColor="#3a7a5a"
          returnKeyType="done"
          maxLength={200}
          multiline
        />

        <Text style={styles.fieldLabel}>FREQUENCY</Text>
        <View style={styles.freqRow}>
          {FREQUENCY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.freqBtn, frequency === opt.value && styles.freqBtnActive]}
              onPress={() => setFrequency(opt.value)}
            >
              <Text style={[styles.freqBtnText, frequency === opt.value && styles.freqBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!name.trim() || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save Changes</Text>}
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#3a7a5a",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.2)",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#05170e",
    color: "#98eaff",
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  freqRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.15)",
    backgroundColor: "#05170e",
    alignItems: "center",
  },
  freqBtnActive: {
    backgroundColor: "#085331",
    borderColor: "#009951",
  },
  freqBtnText: {
    fontSize: 12,
    color: "#3a7a5a",
  },
  freqBtnTextActive: {
    color: "#98FF9D",
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: "#009951",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  saveBtnDisabled: {
    backgroundColor: "#085331",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
