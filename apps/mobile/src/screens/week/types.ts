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

// One row per completion — only used by DAILY habits with frequencyCount > 1
export interface HabitLogEntry {
  id: string;
  habitId: string;
  loggedAt: string; // ISO datetime, hour:minute precision
}
