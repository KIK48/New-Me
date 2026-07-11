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
import { AppStack, FrequencyType, HabitFrequency } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/client";

type Props = NativeStackScreenProps<AppStack, "EditHabit">;

const PERIOD_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: "DAILY",   label: "Daily" },
  { value: "WEEKLY",  label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY",  label: "Yearly" },
];

function countRange(type: FrequencyType): number[] {
  if (type === "DAILY")   return [1, 2, 3, 4, 5];
  if (type === "WEEKLY")  return [1, 2, 3, 4, 5, 6, 7];
  if (type === "MONTHLY") return Array.from({ length: 28 }, (_, i) => i + 1);
  return Array.from({ length: 52 }, (_, i) => i + 1); // yearly: up to 52 times
}

function countLabel(type: FrequencyType, count: number): string {
  if (type === "DAILY")   return count === 1 ? "once a day" : `${count}× a day`;
  if (type === "WEEKLY")  return count === 1 ? "1 day a week" : `${count} days a week`;
  if (type === "MONTHLY") return count === 1 ? "once a month" : `${count}× a month`;
  return count === 1 ? "once a year" : `${count}× a year`;
}

export default function EditHabitScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const { id, name: initialName, notes: initialNotes, frequency: initialFreq } = route.params;
  const [name, setName] = useState(initialName);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [freqType, setFreqType] = useState<FrequencyType>(initialFreq.type);
  const [freqCount, setFreqCount] = useState(initialFreq.count);
  const [loading, setLoading] = useState(false);

  function handlePeriodChange(type: FrequencyType) {
    setFreqType(type);
    setFreqCount(1); // reset count when period changes
  }

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
          frequencyType: freqType,
          frequencyCount: freqCount,
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

  const counts = countRange(freqType);

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
          keyboardAppearance="dark"
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
          keyboardAppearance="dark"
          returnKeyType="done"
          maxLength={200}
          multiline
        />

        <Text style={styles.fieldLabel}>FREQUENCY</Text>

        {/* Period selector */}
        <View style={styles.periodRow}>
          {PERIOD_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.periodBtn, freqType === opt.value && styles.periodBtnActive]}
              onPress={() => handlePeriodChange(opt.value)}
            >
              <Text style={[styles.periodBtnText, freqType === opt.value && styles.periodBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Count selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.countRow}
        >
          {counts.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.countBtn, freqCount === n && styles.countBtnActive]}
              onPress={() => setFreqCount(n)}
            >
              <Text style={[styles.countBtnText, freqCount === n && styles.countBtnTextActive]}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.freqSummary}>{countLabel(freqType, freqCount)}</Text>

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
  periodRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.15)",
    backgroundColor: "#05170e",
    alignItems: "center",
  },
  periodBtnActive: {
    backgroundColor: "#085331",
    borderColor: "#009951",
  },
  periodBtnText: {
    fontSize: 13,
    color: "#3a7a5a",
  },
  periodBtnTextActive: {
    color: "#98FF9D",
    fontWeight: "600",
  },
  countRow: {
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  countBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.15)",
    backgroundColor: "#05170e",
    alignItems: "center",
    justifyContent: "center",
  },
  countBtnActive: {
    backgroundColor: "#085331",
    borderColor: "#009951",
  },
  countBtnText: {
    fontSize: 15,
    color: "#3a7a5a",
  },
  countBtnTextActive: {
    color: "#98FF9D",
    fontWeight: "600",
  },
  freqSummary: {
    fontSize: 13,
    color: "#3a7a5a",
    marginTop: 4,
    marginBottom: 4,
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
