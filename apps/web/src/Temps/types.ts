export type Habit = {
    id: string;
    name: string;
}

export type Week = {
    weekID: string; //Monday ex: "2026-01-12"
    startISO: string; //Lunes
    endISO: string;  //Domingo
    days: string[]; // 7 fechas para la semana
}

export type HabitWeekStatus = {
    habitID: string;
    weekID: string;
    days: Record<string, boolean | null>;
}
