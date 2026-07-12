import { useEffect } from "react";
import { Alert, Linking } from "react-native";
import * as Updates from "expo-updates";
import { API_URL } from "../api/client";
import { isNewerVersion } from "../utils/version";

// JS-only changes (screens, UI, logic) ship as OTA updates. expo-updates already
// downloads these silently on launch, but doesn't apply them until the NEXT cold
// start — this forces an immediate reload so the user is never more than one
// relaunch behind, with zero TestFlight involvement.
async function applyOTAUpdateIfAvailable() {
  if (__DEV__ || !Updates.isEnabled) return;
  try {
    const result = await Updates.checkForUpdateAsync();
    if (result.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch (err) {
    console.log("OTA update check failed:", err);
  }
}

// Native changes (new native module, SDK bump) can never be OTA'd — Apple only
// allows a new binary through TestFlight, so the best we can do is tell the user.
// LATEST_NATIVE_VERSION on the API is bumped by hand only on native releases, so
// this stays silent for ordinary OTA-only releases.
async function checkForNativeUpdate() {
  // Meaningless during local dev — you're expected to be ahead of whatever's
  // actually submitted, so comparing against "latest" here is just noise.
  if (__DEV__) return;
  try {
    const res = await fetch(`${API_URL}/app-version`);
    const data = await res.json();
    const latest = data.latestRuntimeVersion as string | undefined;
    const current = Updates.runtimeVersion;
    if (!latest || !current || !isNewerVersion(latest, current)) return;

    Alert.alert(
      "Update Available",
      "A new version of New Me is ready. Update via TestFlight to get the latest features.",
      [
        { text: "Later", style: "cancel" },
        { text: "Open TestFlight", onPress: () => Linking.openURL("itms-beta://") },
      ],
    );
  } catch (err) {
    console.log("Native version check failed:", err);
  }
}

export function useAppUpdates() {
  useEffect(() => {
    applyOTAUpdateIfAvailable();
    checkForNativeUpdate();
  }, []);
}
