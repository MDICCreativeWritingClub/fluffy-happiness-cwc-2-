"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ThemeMode = "light" | "dark";

interface ThemeModeContextType {
  mode: ThemeMode;
  toggle: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextType | undefined>(undefined);

const STORAGE_KEY = "cwc_theme_mode";

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initial =
      stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setMode(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  function toggle() {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return <ThemeModeContext.Provider value={{ mode, toggle }}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode(): ThemeModeContextType {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeModeProvider");
  return ctx;
}
