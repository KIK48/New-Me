import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type Mode = "D" | "M" | "S" | "A";

type ModeContextType = {
  mode: Mode | null;
  setMode: (m: Mode | null) => void;
  selectMode: (m: Mode) => void;
};

const ModeContext = createContext<ModeContextType | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode | null>(null);

  function selectMode(next: Mode) {
    setMode(curr => (curr === next ? null : next));
  }

  return (
    <ModeContext.Provider value={{ mode, setMode, selectMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) {
    throw new Error("useMode must be used inside ModeProvider");
  }
  return ctx;
}
