import { create } from "zustand";
import type { ThemeMode } from "@/types";

interface SettingsState {
  theme: ThemeMode;
  language: string;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: "dark",
  language: "zh-CN",
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
}));
