// Set EXPO_PUBLIC_API_URL in apps/mobile/.env (gitignored).
// Dev: your local IP. Prod EAS builds: set via EAS environment variables.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://new-me-l46q.onrender.com";
