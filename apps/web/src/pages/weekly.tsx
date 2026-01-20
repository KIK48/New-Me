import { useEffect, useMemo, useState} from "react";

import { habitsApi } from "../api";
import type { Habit, HabitWeekStatus } from "../Temps/types";
import { addDays, buildWeek, getMondayISO } from "../Temps/week";
import HabitRow from "../components/HabitRow";
import { useMode } from "../hooks/ModeContext";
import AddHabit from "../modals/addHabit";

import '../styles/pages/weekly.css' 

export default function WeekTViewPage() {

  const {mode, selectMode} = useMode();

  const [modalOpen, setModalOpen] = useState(false);

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

  function formatDate(isoDate: string) {
    const [year, month, day] = isoDate.split("-");
    return `${month}/${day}/${year}`;
  }

  async function onToggleDay(habitId: string, dayIso: string) {
    await habitsApi.toggleHabitDay(habitId, weekId, dayIso);
    await refresh();
  }

  return (
    <div className='Weekly focus-glow container' tabIndex={0}>
        <div className='top-selector strip'>
            <div className='date strip strip--info letters'>{formatDate(week.startISO)}</div>

            <button className='top-btns' type="button" onClick={() => setWeekId(addDays(weekId, -7))}>
              <svg className = "arrow-btns" width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                d="M30 16H2M2 16L16 30M2 16L16 2" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeLinecap="round" 
                />
              </svg>
            </button>

            <div className='Crud-btns'>
              <button className={mode === "D" ? "top-btns active" : "top-btns"} onClick={() => selectMode('D')}> {/* This button is not an arrow btn this is minus btn*/}
                <svg width="66" height="66" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path className = 'i-rings' d="M32.5 60C47.6878 60 60 47.6878 60 32.5C60 17.3122 47.6878 5 32.5 5C17.3122 5 5 17.3122 5 32.5C5 47.6878 17.3122 60 32.5 60Z" stroke="#1E1E1E" strokeWidth="4"/>
                  <path className= 'i-minus' d="M22 33H44" stroke="#1E1E1E" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <button className={mode === "M" ? "top-btns active" : "top-btns"} onClick={() => selectMode('M')}> {/* This button is not an arrow btn this is the change btn*/}
                <svg width="25" height="25" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path className='i-changeBtn' d="M2.00049 32L22.0005 42L42.0005 32M2.00049 22L22.0005 32L42.0005 22M22.0005 2L2.00049 12L22.0005 22L42.0005 12L22.0005 2Z" stroke="#1E1E1E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <button className='top-btns'> {/* This button is not an arrow btn this is the save btn*/}
                <svg width="25" height="25" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path className='i-saveBtn' d="M30 38V22H10V38M10 2V12H26M34 38H6C4.93913 38 3.92172 37.5786 3.17157 36.8284C2.42143 36.0783 2 35.0609 2 34V6C2 4.93913 2.42143 3.92172 3.17157 3.17157C3.92172 2.42143 4.93913 2 6 2H28L38 12V34C38 35.0609 37.5786 36.0783 36.8284 36.8284C36.0783 37.5786 35.0609 38 34 38Z" stroke="#1E1E1E" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <button className={mode === "A" ? "top-btns active" : "top-btns"} onClick={() => {
                selectMode('A');
                setModalOpen(true);
              }}> {/* This button is not an arrow btn this is the add btn*/}
                <svg width="66" height="66" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className = 'i-rings' cx="32.5" cy="32.5" r="27.5" stroke="#1E1E1E" strokeWidth="4"/>
                  <path className='i-add'd="M22 33L33 33M33 33C33 33 33 33 44 33M33 33C33 33 33 33 33 22M33 33V44" stroke="#1E1E1E" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {modalOpen && (
                <AddHabit
                  onClose = {() => {
                    setModalOpen(false); 
                    selectMode('A'); // Idk about this error
                  }}
                />
              )}  
            </div>

            <button className='top-btns' type="button" onClick={() => setWeekId(addDays(weekId, 7))}>
              <svg className = "arrow-btns" width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                d="M2 16H30M30 16L16 2M30 16L16 30" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className='date strip strip--info letters' >{formatDate(week.endISO)}</div>
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
