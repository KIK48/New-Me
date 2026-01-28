import type { HabitsRepo, HRepo } from "./helpers/types/getHabits";
import { mockHabitsRepo, HabitosRepo } from "./src/mockHabitsRepo";

export const habitsApi: HabitsRepo = mockHabitsRepo; // Mock Data

export const habitosApi: HRepo = HabitosRepo; // Real Data kind of