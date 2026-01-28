import type { HabitsRepo, HRepo } from "../helpers/types/getHabits";
import { Habitos, mockHabits, mockStatuses, weekCache } from "./mockDB";
import type { HabitWeekStatus, HtWkSs } from "../helpers/types/types";
import { apiGet } from "../helpers/habits";


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

export const HabitosRepo: HRepo = { // This looks good
  async getHabits() {
    return Habitos;
  },

  async getStatusesForWeek(weekID) {
    await Promise.all(
      Habitos.filter(h => h?.id).map(async habit => {
          const key = `${habit.id}:${weekID}`;

          if (weekCache.has(key)) return;

          const week = await apiGet<HtWkSs>(
            `/habit-days/week?habitId=${habit.id}&start=${weekID}`
          );

          weekCache.set(key, week);
        })
    );
    return weekCache;
  },
  async toggleHabitDay(habitID, weekID, dayISO) {
    const st = ensureStatus(habitID, weekID);

    const current = st.days[dayISO] ?? null; // treat undefined as empty

    if (current === null) st.days[dayISO] = true;        // empty -> check
    else if (current === true) st.days[dayISO] = false;  // check -> x
    else st.days[dayISO] = null; 
  },
};