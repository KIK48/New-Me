export type AuthStack = {
  Login: undefined;
  Register: undefined;
};

export type TabStack = {
  Home: undefined;
  Week: undefined;
  Profile: undefined;
};

export type AppStack = {
  Tabs: undefined;
  CreateHabit: undefined;
  EditHabit: { id: string; name: string; notes?: string | null };
  HabitDetail: { id: string; name: string; notes?: string | null };
};
