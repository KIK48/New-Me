// Uses local time methods throughout — never toISOString() which returns UTC
// and would report the wrong date for users in UTC-offset timezones at night.
function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toLocalISO(new Date());
}

// Local calendar date of a full ISO datetime string (e.g. a HabitLog's loggedAt) —
// same UTC-avoidance reasoning as the rest of this file.
export function localDateOf(isoDateTime: string): string {
  return toLocalISO(new Date(isoDateTime));
}

// h:mm AM/PM in local time, for displaying a log entry's timestamp
export function formatTime(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${period}`;
}

export function getMondayISO(from: Date = new Date()): string {
  const d = new Date(from);
  const day = d.getDay(); // local day: 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toLocalISO(d);
}

export function addDays(isoDate: string, n: number): string {
  // "T00:00:00" without Z = local midnight, not UTC midnight
  const d = new Date(isoDate + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toLocalISO(d);
}

// Returns array of 7 ISO dates starting from mondayISO (Mon → Sun)
export function buildWeekDates(mondayISO: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayISO, i));
}

// mm/dd/yy
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}/${year.slice(2)}`;
}

export const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// month is 1-indexed (1 = January), matching Prisma/JS date conventions used elsewhere
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getMonthDates(year: number, month: number): string[] {
  const n = daysInMonth(year, month);
  return Array.from(
    { length: n },
    (_, i) => `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
  );
}

// Monday-start calendar grid for a month, padded with nulls so every row has 7 cells
export function getCalendarGrid(year: number, month: number): (string | null)[] {
  const dates = getMonthDates(year, month);
  const firstDow = new Date(dates[0] + "T00:00:00").getDay(); // 0=Sun..6=Sat
  const leadingBlanks = firstDow === 0 ? 6 : firstDow - 1;
  const grid: (string | null)[] = Array(leadingBlanks).fill(null).concat(dates);
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

export function addMonths(year: number, month: number, n: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + n;
  return { year: Math.floor(total / 12), month: (((total % 12) + 12) % 12) + 1 };
}
