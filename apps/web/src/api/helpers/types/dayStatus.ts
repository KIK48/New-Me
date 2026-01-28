export const DayStatus = {
  DONE: "DONE",
  MISSED: "MISSED",
  UNSET: "UNSET",
} as const;

export type DayStatus = typeof DayStatus[keyof typeof DayStatus];