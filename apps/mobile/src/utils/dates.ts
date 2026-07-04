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
