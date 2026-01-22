import type { HabitsRepo, HRepo } from "./getHabits";
import { mockHabitsRepo, HabitosRepo } from "./mockHabitsRepo";

export const habitsApi: HabitsRepo = mockHabitsRepo;

export const habitosApi: HRepo = HabitosRepo;