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
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStack } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/client";

type Props = NativeStackScreenProps<AppStack, "CreateHabit">;

export default function CreateHabitScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
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
        body: JSON.stringify({ name: name.trim(), notes: notes.trim() || undefined }),
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
});
