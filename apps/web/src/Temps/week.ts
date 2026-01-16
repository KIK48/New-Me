export function toISODate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${y}-${m}-${day}`;
}

export function addDays(dateISO: string, days: number): string {
    const d = new Date(dateISO + "T00:00:00");
    d.setDate(d.getDate() + days);
    return toISODate(d);
}

export function getMondayISO(date = new Date()): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return toISODate(d);
}

export function buildWeek(weekIDMondayISO: string) {
    const days = Array.from({length: 7}, (_, i) => addDays(weekIDMondayISO, i));
    return {
        weekID: weekIDMondayISO,
        startISO: days[0],
        endISO: days[6],
        days,
    };
}