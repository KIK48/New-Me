import { buildWeekDates, getMondayISO, localDateOf } from "./dates";

type DayStatus = "UNSET" | "DONE" | "MISSED";
interface LogLike {
  habitId: string;
  loggedAt: string;
}

// Any habit with a target above 1 ("workout 2x/month", "eat 2x/day") records
// each completion as a timestamped HabitLog, so several can land on one day.
// Habits with a target of 1 keep using a single HabitDay checkmark.
export function usesLogs(_frequencyType: string | undefined, frequencyCount: number | undefined): boolean {
  return (frequencyCount ?? 1) > 1;
}

// Completions per calendar day for one habit. A DONE checkmark with no logs on
// that day still counts as 1, so history from before logs were used for
// weekly/monthly/yearly habits doesn't disappear.
export function dayCounts(
  habitId: string,
  logs: LogLike[],
  days: Record<string, DayStatus> | undefined,
): Record<string, number> {
  const counts: Record<string, number> = {};
  logs.forEach((l) => {
    if (l.habitId !== habitId) return;
    const d = localDateOf(l.loggedAt);
    counts[d] = (counts[d] ?? 0) + 1;
  });
  Object.entries(days ?? {}).forEach(([d, s]) => {
    if (s === "DONE" && !counts[d]) counts[d] = 1;
  });
  return counts;
}

// Total completions inside the period (day / Mon-Sun week / month / year) that
// contains `dateISO`. Home and every Calendar view use this one function, so
// they can never disagree about a habit's progress.
export function countInPeriod(
  counts: Record<string, number>,
  frequencyType: string | undefined,
  dateISO: string,
): number {
  const type = frequencyType ?? "DAILY";
  if (type === "DAILY") return counts[dateISO] ?? 0;
  if (type === "WEEKLY") {
    const monday = getMondayISO(new Date(dateISO + "T00:00:00"));
    return buildWeekDates(monday).reduce((sum, d) => sum + (counts[d] ?? 0), 0);
  }
  const prefix = type === "MONTHLY" ? dateISO.slice(0, 8) : dateISO.slice(0, 5);
  return Object.entries(counts).reduce((sum, [d, n]) => sum + (d.startsWith(prefix) ? n : 0), 0);
}

// Human label for the period, used in "this week" style subtext
export function periodWord(frequencyType: string | undefined): string {
  switch (frequencyType) {
    case "WEEKLY": return "this week";
    case "MONTHLY": return "this month";
    case "YEARLY": return "this year";
    default: return "today";
  }
}

// Noon local time on a past/future day, so a backdated log lands on the right
// calendar date in every timezone; today's logs keep the real current time.
export function loggedAtFor(dayISO: string | undefined, todayISO: string): string {
  if (!dayISO || dayISO === todayISO) return new Date().toISOString();
  return new Date(dayISO + "T12:00:00").toISOString();
}
