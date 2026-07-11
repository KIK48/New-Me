import { todayISO, addDays } from "./dates";

type DayStatus = "DONE" | "MISSED" | "UNSET";

// Mirrors FrequencyType + frequencyCount fields in the DB schema.
export type FrequencyRule =
  | { type: "DAILY";   count: number }
  | { type: "WEEKLY";  count: number }
  | { type: "MONTHLY"; count: number }
  | { type: "YEARLY";  count: number };

export function calculateStreak(
  days: Record<string, DayStatus>,
  rule: FrequencyRule = { type: "DAILY", count: 1 },
): number {
  const today = todayISO();
  switch (rule.type) {
    case "DAILY":
      return dailyStreak(days, today);
    case "WEEKLY":
      return timesPerWeekStreak(days, today, rule.count);
    case "MONTHLY":
      return timesPerMonthStreak(days, today, rule.count);
    case "YEARLY":
      return timesPerYearStreak(days, today, rule.count);
  }
}

// Returns 0 (Sun) through 6 (Sat) for a local date string
function dayOfWeek(iso: string): number {
  return new Date(iso + "T00:00:00").getDay();
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

// Consecutive months where the habit was done at least `times` times
function timesPerMonthStreak(
  days: Record<string, DayStatus>,
  today: string,
  times: number,
): number {
  const [todayYear, todayMonth] = today.split("-").map(Number);
  let streak = 0;
  for (let m = 0; m < 24; m++) {
    let y = todayYear;
    let mo = todayMonth - m;
    while (mo <= 0) { mo += 12; y--; }
    const daysInMonth = new Date(y, mo, 0).getDate();
    let doneCount = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (date > today) continue;
      if ((days[date] ?? "UNSET") === "DONE") doneCount++;
    }
    if (m === 0) {
      // current month: only fail if can't possibly reach target
      const dayOfMonth = new Date(today + "T00:00:00").getDate();
      const daysLeft = daysInMonth - dayOfMonth;
      if (doneCount + daysLeft < times) break;
      if (doneCount >= times) streak++;
    } else {
      if (doneCount >= times) streak++;
      else break;
    }
  }
  return streak;
}

// Consecutive years where the habit was done at least `times` times
function timesPerYearStreak(
  days: Record<string, DayStatus>,
  today: string,
  times: number,
): number {
  const todayYear = new Date(today + "T00:00:00").getFullYear();
  let streak = 0;
  for (let y = todayYear; y >= todayYear - 10; y--) {
    let doneCount = 0;
    for (const [date, status] of Object.entries(days)) {
      if (date.startsWith(`${y}-`) && date <= today && status === "DONE") doneCount++;
    }
    if (y === todayYear) {
      // Current year: only fail if impossible to reach target
      const daysLeft = (new Date(`${y}-12-31T00:00:00`).getTime() - new Date(today + "T00:00:00").getTime()) / 86400000;
      if (doneCount + daysLeft < times) break;
      if (doneCount >= times) streak++;
    } else {
      if (doneCount >= times) streak++;
      else break;
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
