import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStack, FrequencyType } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/client";

type Props = NativeStackScreenProps<AppStack, "CreateHabit">;

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
  return Array.from({ length: 52 }, (_, i) => i + 1);
}

export default function CreateHabitScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [freqType, setFreqType] = useState<FrequencyType>("DAILY");
  const [freqCount, setFreqCount] = useState(1);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/habits`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim(), notes: notes.trim() || undefined, frequencyType: freqType, frequencyCount: freqCount }),
      });
      if (!res.ok) {
        const body = await res.json();
        Alert.alert("Error", body.error ?? "Failed to create habit");
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
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Backdrop — tap anywhere above the card to dismiss */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={() => navigation.goBack()}
      />

      {/* Card */}
      <View style={styles.card}>
        {/* Drag handle */}
        <View style={styles.handle} />

        <Text style={styles.eyebrow}>NEW HABIT</Text>
        <Text style={styles.title}>What do you want to build?</Text>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Read for 20 minutes"
          placeholderTextColor="#3a7a5a"
          autoFocus
          returnKeyType="next"
          maxLength={80}
        />

        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes (optional)"
          placeholderTextColor="#3a7a5a"
          returnKeyType="done"
          onSubmitEditing={handleSave}
          maxLength={200}
        />

        <Text style={styles.freqLabel}>FREQUENCY</Text>
        <View style={styles.freqRow}>
          {PERIOD_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.freqBtn, freqType === opt.value && styles.freqBtnActive]}
              onPress={() => { setFreqType(opt.value); setFreqCount(1); }}
            >
              <Text style={[styles.freqBtnText, freqType === opt.value && styles.freqBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.countRow}>
          {countRange(freqType).map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.countBtn, freqCount === n && styles.countBtnActive]}
              onPress={() => setFreqCount(n)}
            >
              <Text style={[styles.countBtnText, freqCount === n && styles.countBtnTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!name.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Add Habit</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
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
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#3a7a5a",
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "400",
    color: "#98FF9D",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#98EAFF",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#001b0e",
    color: "#98eaff",
    marginBottom: 12,
  },
  notesInput: {
    marginBottom: 24,
  },
  saveBtn: {
    backgroundColor: "#009951",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  saveBtnDisabled: {
    backgroundColor: "#085331",
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelBtn: {
    alignSelf: "center",
    padding: 8,
  },
  cancelBtnText: {
    color: "#3a7a5a",
    fontSize: 14,
  },
  freqLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#3a7a5a",
    marginBottom: 8,
  },
  freqRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.15)",
    backgroundColor: "#001b0e",
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
  countRow: {
    gap: 8,
    paddingVertical: 4,
    paddingBottom: 8,
  },
  countBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(152,234,255,0.15)",
    backgroundColor: "#001b0e",
    alignItems: "center",
    justifyContent: "center",
  },
  countBtnActive: {
    backgroundColor: "#085331",
    borderColor: "#009951",
  },
  countBtnText: {
    fontSize: 14,
    color: "#3a7a5a",
  },
  countBtnTextActive: {
    color: "#98FF9D",
    fontWeight: "600",
  },
});
