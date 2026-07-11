import { todayISO, addDays } from "./dates";

type DayStatus = "DONE" | "MISSED" | "UNSET";

// Mirrors the Frequency enum in the DB schema.
// Add new cases here as new frequency options are introduced.
export type FrequencyRule =
  | { type: "DAILY" }
  | { type: "WEEKDAYS" }
  | { type: "THREE_PER_WEEK" }
  | { type: "TWO_PER_WEEK" };

export function calculateStreak(
  days: Record<string, DayStatus>,
  rule: FrequencyRule = { type: "DAILY" },
): number {
  const today = todayISO();
  switch (rule.type) {
    case "DAILY":
      return dailyStreak(days, today);
    case "WEEKDAYS":
      return weekdayStreak(days, today);
    case "THREE_PER_WEEK":
      return timesPerWeekStreak(days, today, 3);
    case "TWO_PER_WEEK":
      return timesPerWeekStreak(days, today, 2);
  }
}

// Returns 0 (Sun) through 6 (Sat) for a local date string
function dayOfWeek(iso: string): number {
  return new Date(iso + "T00:00:00").getDay();
}

// Weekdays only — Sat/Sun are skipped (treated as grace days)
function weekdayStreak(days: Record<string, DayStatus>, today: string): number {
  const todayStatus = days[today] ?? "UNSET";
  const todayDow = dayOfWeek(today);
  const isWeekend = todayDow === 0 || todayDow === 6;

  if (!isWeekend && todayStatus === "MISSED") return 0;

  // If today is a weekend or unset weekday, start from yesterday
  const startOffset = !isWeekend && todayStatus === "DONE" ? 0 : -1;

  let streak = 0;
  for (let i = startOffset; i >= -365; i--) {
    const date = addDays(today, i);
    const dow = dayOfWeek(date);
    if (dow === 0 || dow === 6) continue; // skip weekends
    const status = days[date] ?? "MISSED";
    if (status === "DONE") {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// Consecutive weeks where the habit was done at least `times` times
function timesPerWeekStreak(
  days: Record<string, DayStatus>,
  today: string,
  times: number,
): number {
  // Find the Monday of the current week
  const dow = dayOfWeek(today);
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const thisMonday = addDays(today, -daysFromMonday);

  let streak = 0;
  // Check up to 52 weeks back
  for (let w = 0; w < 52; w++) {
    const weekStart = addDays(thisMonday, -w * 7);
    let doneCount = 0;
    for (let d = 0; d < 7; d++) {
      const date = addDays(weekStart, d);
      // Don't count future days in the current week
      if (date > today) continue;
      if ((days[date] ?? "UNSET") === "DONE") doneCount++;
    }
    // Current week gets partial credit — only break if impossible to still meet target
    if (w === 0) {
      const daysLeft = 7 - (dow === 0 ? 7 : dow);
      if (doneCount + daysLeft < times) break; // can't reach target this week
      if (doneCount >= times) streak++;
      // else current week still in progress — don't count yet but don't break
    } else {
      if (doneCount >= times) {
        streak++;
      } else {
        break;
      }
    }
  }
  return streak;
}

function dailyStreak(days: Record<string, DayStatus>, today: string): number {
  const todayStatus = days[today] ?? "UNSET";
  if (todayStatus === "MISSED") return 0;

  // Grace period: if today is unset the user may not have logged yet,
  // so start counting from yesterday instead of breaking the streak
  const startOffset = todayStatus === "UNSET" ? -1 : 0;

  let streak = 0;
  for (let i = startOffset; i >= -365; i--) {
    const status = days[addDays(today, i)] ?? "MISSED";
    if (status === "DONE") {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
