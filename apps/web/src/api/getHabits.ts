import type {Habit, HabitWeekStatus} from "../Temps/types";

export type HabitsRepo = {
    getHabits(): Promise<Habit[]>;
    getStatusesForWeek(weekID:string): Promise<HabitWeekStatus[]>;
    toggleHabitDay(habitID: string, weekID: string, dayISO: string): Promise<void>;
};