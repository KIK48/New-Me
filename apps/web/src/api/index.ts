import type { HabitsRepo } from "./getHabits";
import { mockHabits } from "../Temps/mockDB";
import { mockHabitsRepo } from "./mockHabitsRepo";

export const habitsApi: HabitsRepo = mockHabitsRepo;