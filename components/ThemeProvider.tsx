"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getTheme, setTheme, getAccent, setAccent, type Theme, type Accent, ACCENTS } from "@/lib/storage";

type ThemeCtx = {
  theme: Theme;
  accent: Accent;
  toggleTheme: () => void;
  setAccent: (a: Accent) => void;
};

const Ctx = createContext<ThemeCtx>({
  theme: "dark",
  accent: "amber",
  toggleTheme: () => {},
  setAccent: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [accent, setAccentState] = useState<Accent>("amber");

  useEffect(() => {
    const t = getTheme();
    const a = getAccent();
    setThemeState(t);
    setAccentState(a);
    document.documentElement.dataset.theme = t;
    document.documentElement.dataset.accent = a;
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }

  function changeAccent(a: Accent) {
    setAccentState(a);
    setAccent(a);
    document.documentElement.dataset.accent = a;
  }

  return <Ctx.Provider value={{ theme, accent, toggleTheme, setAccent: changeAccent }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}

export { ACCENTS };
