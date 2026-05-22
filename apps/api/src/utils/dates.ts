
export function startOfWeekMonday(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const day = d.getDay(); // Sun=0, Mon=1...
  const diff = day === 0 ? -6 : 1 - day; // go back to Monday
  d.setDate(d.getDate() + diff);

  return d;
}

export function parseISODateOnly(iso: string) {
  // expects "YYYY-MM-DD"
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d;
}
