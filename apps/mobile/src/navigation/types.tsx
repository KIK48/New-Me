export type AuthStack = {
  Login: undefined;
  Register: undefined;
};

export type AppStack = {
  Habits: undefined;
  CreateHabit: undefined;
  EditHabit: { id: string; name: string; notes?: string | null };
};
