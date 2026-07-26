import "dotenv/config"; // must be first so process.env is populated before anything else imports it
import express from "express";
import cors from "cors";

import habitsRouter from "./routes/habits.routes";
import habitDay from "./routes/habitDay.routes";
import habitLog from "./routes/habitLog.routes";
import notifications from "./routes/notifications.routes";
import authRouter from "./routes/auth.routes";
import { requireAuth } from "./middleware/requireAuth";

const app = express();

// CORS_ORIGIN is set in .env — localhost for dev, Vercel URL for prod
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

// Lets the mobile app tell "OTA JS update available" (handled silently by expo-updates)
// apart from "native rebuild needed" (Apple only allows that via TestFlight, never OTA) —
// LATEST_NATIVE_VERSION is bumped by hand only when a full EAS Build ships.
app.get("/app-version", (_req, res) =>
  res.json({ latestRuntimeVersion: process.env.LATEST_NATIVE_VERSION ?? "1.1.0" }),
);

// Public: no token needed to log in / register
app.use("/auth", authRouter);

// Protected: requireAuth middleware validates the JWT before every request
app.use("/habits", requireAuth, habitsRouter);
app.use("/habit-days", requireAuth, habitDay);
app.use("/habit-logs", requireAuth, habitLog);
app.use("/notifications", requireAuth, notifications);

const port = process.env.PORT ?? 4000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));


/* to call the post api for habit-days
fetch("http://localhost:4000/habit-days", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    id: "cmkoyv0nq0000sgf1tl7cokw9",
    date: "2026-01-21T00:00:00.000Z",
    status: "DONE",
  }),
})
  .then(res => res.json())
  .then(data => console.log("Created habit day:", data))
  .catch(console.error);
*/
