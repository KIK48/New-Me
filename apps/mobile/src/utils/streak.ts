import { todayISO, addDays } from "./dates";

type DayStatus = "DONE" | "MISSED" | "UNSET";

// Extensible rule type — only "daily" implemented now.
// When habit frequency rules (#43) land, add variants here:
//   | { type: "weekly"; timesPerWeek: number }
// and add a case in calculateStreak's switch.
export type FrequencyRule = { type: "daily" };

export function calculateStreak(
  days: Record<string, DayStatus>,
  rule: FrequencyRule = { type: "daily" },
): number {
  switch (rule.type) {
    case "daily":
      return dailyStreak(days, todayISO());
  }
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
