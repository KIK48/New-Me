import { apiGet } from "../api/habits";
import type {Habit, Habito, HabitWeekStatus} from "./types";

export const mockHabits: Habit[] = [
    {id: "h1", name: "Gym"},
    {id: "h2", name: "Study"},
    {id: "h3", name: "Clean room"},
];

const data = await apiGet<Habito[]>("/habits");
export const Habitos: Habito[] = data;

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