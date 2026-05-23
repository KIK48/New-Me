import type {Habit, Habito, HabitWeekStatus, HtWkSs} from "./types";
import type { DayStatus } from "./dayStatus";

export type HabitsRepo = {
    getHabits(): Promise<Habit[]>;
    getStatusesForWeek(weekID:string): Promise<HabitWeekStatus[]>;
    toggleHabitDay(habitID: string, weekID: string, dayISO: string): Promise<void>;
};

export type HRepo = {
    getHabits(): Promise<Habito[]>;
    getStatusesForWeek(weekID:string): Promise<Map<string, HtWkSs>>;
    toggleHabitDay(habitID: string, weekID: string, dayISO: string): Promise<void>;
    deleteHabit(habitID: string): Promise<void>;
    saveStatuses(days: Map<string, DayStatus>): Promise<void>;
};