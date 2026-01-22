import type { HabitsRepo, HRepo } from "./getHabits";
import { Habitos, mockHabits, mockStatuses } from "../Temps/mockDB";
import type { HabitWeekStatus } from "../Temps/types";

function ensureStatus(habitID: string, weekID: string): HabitWeekStatus {
  let existing = mockStatuses.find((s) => s.habitID === habitID && s.weekID === weekID);
  if (existing) return existing;

  const created: HabitWeekStatus = {
    habitID,
    weekID,
    days: {},
  };
  mockStatuses.push(created);
  return created;
}

export const mockHabitsRepo: HabitsRepo = {
  async getHabits() {
    return mockHabits;
  },

  async getStatusesForWeek(weekID) {
    return mockStatuses.filter((s) => s.weekID === weekID);
  },

  async toggleHabitDay(habitID, weekID, dayISO) {
    const st = ensureStatus(habitID, weekID);

    const current = st.days[dayISO] ?? null; // treat undefined as empty

    if (current === null) st.days[dayISO] = true;        // empty -> check
    else if (current === true) st.days[dayISO] = false;  // check -> x
    else st.days[dayISO] = null; 
  },
};

export const HabitosRepo: HRepo = {
  async getHabits() {
    return Habitos;
  },

  async getStatusesForWeek(weekID) {
    return mockStatuses.filter((s) => s.weekID === weekID);
  },
  async toggleHabitDay(habitID, weekID, dayISO) {
    const st = ensureStatus(habitID, weekID);

    const current = st.days[dayISO] ?? null; // treat undefined as empty

    if (current === null) st.days[dayISO] = true;        // empty -> check
    else if (current === true) st.days[dayISO] = false;  // check -> x
    else st.days[dayISO] = null; 
  },
};