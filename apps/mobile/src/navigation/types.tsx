export type AuthStack = {
  Login: undefined;
  Register: undefined;
};

export type TabStack = {
  Home: undefined;
  Week: undefined;
  Profile: undefined;
};

export type Frequency = "DAILY" | "WEEKDAYS" | "THREE_PER_WEEK" | "TWO_PER_WEEK";

export type AppStack = {
  Tabs: undefined;
  CreateHabit: undefined;
  EditHabit: { id: string; name: string; notes?: string | null; frequency: Frequency };
  HabitDetail: { id: string; name: string; notes?: string | null; frequency: Frequency };
};
