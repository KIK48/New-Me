export type AuthStack = {
  Login: undefined;
  Register: undefined;
};

export type TabStack = {
  Home: undefined;
  Week: undefined;
  Profile: undefined;
};

export type FrequencyType = "DAILY" | "WEEKLY" | "MONTHLY";

export type HabitFrequency = {
  type: FrequencyType;
  count: number; // times per day / days per week / times per month
};

export type AppStack = {
  Tabs: undefined;
  CreateHabit: undefined;
  EditHabit: { id: string; name: string; notes?: string | null; frequency: HabitFrequency };
  HabitDetail: { id: string; name: string; notes?: string | null; frequency: HabitFrequency };
};
