export function getMondayISO(from: Date = new Date()): string {
  const d = new Date(from);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0];
}

export function addDays(isoDate: string, n: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split("T")[0];
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

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}
