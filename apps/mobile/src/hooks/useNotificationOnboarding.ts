import { useEffect } from "react";
import { Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/client";

const PROMPTED_KEY = "notificationsPrompted";

// Fires once ever, the first time a token becomes available (covers both a
// brand new registration and an existing user's first launch after this
// feature ships) — never nags again after the first answer either way.
export function useNotificationOnboarding() {
  const { token, authorizedFetch } = useAuth();

  useEffect(() => {
    if (!token) return;

    (async () => {
      const alreadyPrompted = await SecureStore.getItemAsync(PROMPTED_KEY);
      if (alreadyPrompted) return;
      await SecureStore.setItemAsync(PROMPTED_KEY, "1");

      Alert.alert(
        "Stay on track",
        "Get reminders for your habits — daily check-ins, weekly summaries, or custom alerts you set up yourself. You can change this anytime in Profile.",
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Enable",
            onPress: async () => {
              const { status } = await Notifications.requestPermissionsAsync();
              if (status !== "granted") return;

              try {
                await authorizedFetch(`${API_URL}/notifications/settings`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ enabled: true }),
                });
              } catch {
                // Settings screen will reflect the real state next time it's opened either way
              }
            },
          },
        ],
      );
    })();
  }, [token]);
}
