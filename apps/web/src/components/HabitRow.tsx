import type { Habit, Week, HabitWeekStatus } from "../Temps/types";

import checkIcon from "/Check square.svg";
import xIcon from "/X square.svg";

import { useMode } from "../hooks/ModeContext";

type Props = {
  habit: Habit;
  week: Week;
  status?: HabitWeekStatus;
  onToggleDay: (habitId: string, dayIso: string) => void;
};

export default function HabitRow({ habit, week, status, onToggleDay }: Props) {

  const {mode} = useMode();

  return (
    <div className="Habit strip">
      <div className="Title-Habit strip letters">
        <span className={mode === "D" ? "habit-name active" : "habit-name"}>{habit.name}</span> {mode === "D" && (
          <button className="delete-svg-btn" aria-label="Toggle habit">
            <svg className="i-delete-tag" width="39" height="35" viewBox="0 0 39 35" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0_34_39)">
                <path className="i-delete-jtag" d="M34.125 6H13L1.625 18L13 30H34.125C34.987 30 35.8136 29.6839 36.4231 29.1213C37.0326 28.5587 37.375 27.7956 37.375 27V9C37.375 8.20435 37.0326 7.44129 36.4231 6.87868C35.8136 6.31607 34.987 6 34.125 6Z" stroke="#1E1E1E" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                <path className="i-delete-jx" d="M28.75 14L19 23M19 14L28.75 23" stroke="#1E1E1E" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
              </g>
              <defs>
                <clipPath id="clip0_34_39">
                  <rect width="39" height="36" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </button>

        )}
      </div> {/* Here we check for mode for delete rn */}

      <div className="Boxes-Habit strip">
        {week.days.map((dayIso) => {
          const value = status?.days?.[dayIso] ?? null;
          const cls =
            value === true
              ? "box-selector is-yes"
              : value === false
              ? "box-selector is-no"
              : "box-selector";

          return (
            <button
              key={dayIso}
              type="button"
              className={cls}
              title={dayIso}
              onClick={() => onToggleDay(habit.id, dayIso)}
            >
              {value !== null && (
                <img
                  src={value ? checkIcon : xIcon}
                  alt={value ? "done" : "not done"}
                  className="icon-onBox"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
