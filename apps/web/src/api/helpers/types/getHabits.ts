import type {Habit, Habito, HabitWeekStatus, HtWkSs} from "./types";

export type HabitsRepo = {
    getHabits(): Promise<Habit[]>;
    getStatusesForWeek(weekID:string): Promise<HabitWeekStatus[]>;
    toggleHabitDay(habitID: string, weekID: string, dayISO: string): Promise<void>;
};

export type HRepo = {
    getHabits(): Promise<Habito[]>;
    getStatusesForWeek(weekID:string): Promise<Map<string, HtWkSs>>;
    toggleHabitDay(habitID: string, weekID: string, dayISO: string): Promise<void>;
};