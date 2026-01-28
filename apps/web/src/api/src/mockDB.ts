import { apiGet } from "../helpers/habits";
import type {Habit, Habito, HabitWeekStatus, HtWkSs} from "../helpers/types/types";

export const mockHabits: Habit[] = [
    {id: "h1", name: "Gym"},
    {id: "h2", name: "Study"},
    {id: "h3", name: "Clean room"},
];

const habit_data = await apiGet<Habito[]>("/habits");
export const Habitos: Habito[] = habit_data;

export let mockStatuses: HabitWeekStatus[] = [
    {
        habitID: "h1",
        weekID: "2026-01-12",
        days: {
            "2026-01-12": true,
            "2026-01-13": true,
            "2026-01-14": false,
            "2026-01-15": true,
            "2026-01-16": false,
            "2026-01-17": false,
            "2026-01-18": false,
        },
    },
    {
        habitID: "h2",
        weekID: "2026-01-12",
        days: {
            "2026-01-12": false,
            "2026-01-13": true,
            "2026-01-14": true,
            "2026-01-15": false,
            "2026-01-16": true,
            "2026-01-17": false,
            "2026-01-18": false,
        },
    },
];

//const status_data = await apiGet<Week>("/habit-days/week"); <- this is the api we need to call to fetch statuses but
export const weekCache = new Map<string, HtWkSs>();