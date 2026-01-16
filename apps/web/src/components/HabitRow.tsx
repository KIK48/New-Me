import type { Habit, Week, HabitWeekStatus } from "../Temps/types";

import checkIcon from "/Check square.svg";
import xIcon from "/X square.svg";

type Props = {
  habit: Habit;
  week: Week;
  status?: HabitWeekStatus;
  onToggleDay: (habitId: string, dayIso: string) => void;
};

export default function HabitRow({ habit, week, status, onToggleDay }: Props) {
  return (
    <div className="Habit strip">
      <div className="Title-Habit strip letters">{habit.name}</div>

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
