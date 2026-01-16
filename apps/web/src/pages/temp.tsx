import { useEffect, useMemo, useState } from "react";
import { habitsApi } from "../api";
import type { Habit, HabitWeekStatus } from "../Temps/types";
import { addDays, buildWeek, getMondayISO } from "../Temps/week";
import HabitRow from "../components/HabitRow";

export default function WeekViewPage() {
  const [weekId, setWeekId] = useState(() => getMondayISO());
  const week = useMemo(() => buildWeek(weekId), [weekId]);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [statuses, setStatuses] = useState<HabitWeekStatus[]>([]);

  async function refresh() {
    const [h, s] = await Promise.all([
      habitsApi.getHabits(),
      habitsApi.getStatusesForWeek(weekId),
    ]);
    setHabits(h);
    setStatuses(s);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekId]);

  function findStatus(habitId: string) {
    return statuses.find((s) => s.habitID === habitId);
  }

  async function onToggleDay(habitId: string, dayIso: string) {
    await habitsApi.toggleHabitDay(habitId, weekId, dayIso);
    await refresh();
  }

  return (
    <div className="content">
      <div className="week-header">
        <button type="button" onClick={() => setWeekId(addDays(weekId, -7))}>
          Prev
        </button>

        <div className="week-title">
          Week: {week.startISO} → {week.endISO}
        </div>

        <button type="button" onClick={() => setWeekId(addDays(weekId, 7))}>
          Next
        </button>
      </div>

      <div className="week-body">
        {habits.map((h) => (
          <HabitRow
            key={h.id}
            habit={h}
            week={week}
            status={findStatus(h.id)}
            onToggleDay={onToggleDay}
          />
        ))}
      </div>
    </div>
  );
}
