import { useEffect, useMemo, useState } from "react";
import { habitsApi } from "../api";
import type { Habit, HabitWeekStatus } from "../Temps/types";
import { addDays, buildWeek, getMondayISO } from "../Temps/week";
import HabitRow from "../components/HabitRow";

import '../styles/pages/weekly.css' 

export default function WeekTViewPage() {
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
    <div className='Weekly focus-glow container' tabIndex={0}>
        <div className='top-selector strip'>
            <div className='date strip strip--info letters'>{week.startISO}</div>
            <button className='arrow-btn' type="button" onClick={() => setWeekId(addDays(weekId, -7))}>
            <svg className = "i-btn" width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                d="M30 16H2M2 16L16 30M2 16L16 2" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeLinecap="round" 
                />
            </svg>
            </button>
            <button className='arrow-btn' type="button" onClick={() => setWeekId(addDays(weekId, 7))}>
            <svg className = "i-btn" width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                d="M2 16H30M30 16L16 2M30 16L16 30" 
                stroke="currentColor" 
                stroke-width="4" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                />
            </svg>

            </button>
            <div className='date strip strip--info letters' >{week.endISO}</div>
      </div>

      <div className='Habit strip' id='top'> {/** Here this should be a strip but invisible if it makes sense **/}
        <div className='Title-Habit strip strip--info letters' id='info'>Habit</div> {/** This should be the title saying habit **/}
        <div className='Boxes-Habit strip strip--info letters' id='info'> {/** This should be the days **/}
          <div className='day'>Mon</div>
          <div className='day'>Tue</div>
          <div className='day'>Wed</div>
          <div className='day'>Thurs</div>
          <div className='day'>Fri</div>
          <div className='day'>Sat</div>
          <div className='day'>Sun</div>
        </div> 

      </div>

      <div className="habits">
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
