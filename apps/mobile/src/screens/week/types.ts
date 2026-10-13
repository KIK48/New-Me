export type DayStatus = "UNSET" | "DONE" | "MISSED";

// statuses[habitId][dayISO] = DayStatus — full history, shared across all 4 views
export type StatusMap = Record<string, Record<string, DayStatus>>;

export type ViewMode = "daily" | "weekly" | "monthly" | "yearly";

export interface Habit {
  id: string;
  name: string;
  frequencyType?: string;
  frequencyCount?: number;
  [key: string]: any;
}

// One row per completion — used by any habit with frequencyCount > 1, of any frequency type.
// Home and every Calendar view count them through utils/periods.ts so they always agree.
export interface HabitLogEntry {
  id: string;
  habitId: string;
  loggedAt: string; // ISO datetime, hour:minute precision
}
