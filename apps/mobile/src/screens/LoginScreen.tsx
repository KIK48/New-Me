import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStack } from "../navigation/types";
import { API_URL } from "../api/client";

type Props = {
  navigation: NativeStackNavigationProp<AuthStack>;
};

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        await login(data.token);
      } else {
        setError(data.error ?? "Invalid email or password.");
      }
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/icon.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>
        <Text style={styles.new}>New </Text>
        <Text style={styles.me}>Me</Text>
      </Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#98EAFF"
          keyboardAppearance="dark"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#98EAFF"
          keyboardAppearance="dark"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>
      {error !== "" && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Log In</Text>}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.registerBtn}
        onPress={() => navigation.navigate("Register")}
      >
        <Text style={styles.registerBtnText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#000603",
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
  },
  new: {
    color: "#98FF9D",
    textShadowColor: "#00ff04",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  me: {
    color: "#98EAFF",
    textShadowColor: "#00c9fb",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  inputContainer: {
    padding: 20,
    gap: 20,
    marginBottom: 24,
    shadowColor: "#00ff04",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#98EAFF",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#001b0e",
    color: "#98EAFF",
  },
  error: {
    color: "#ff5555",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#009951",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#085331",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  registerBtn: {
    marginTop: 16,
    alignSelf: "center",
    padding: 8,
  },
  registerBtnText: {
    color: "#98EAFF",
    fontSize: 14,
  },
});
