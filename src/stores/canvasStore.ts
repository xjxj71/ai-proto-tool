import { create } from "zustand";
import type { CanvasJSON } from "@/utils/canvasSerializer";

type SaveStatus = "saved" | "saving" | "unsaved";

const MAX_HISTORY = 50;

interface CanvasState {
  history: CanvasJSON[];
  historyIndex: number;
  saveStatus: SaveStatus;
  objectCount: number;

  pushHistory: (snapshot: CanvasJSON) => void;
  goBack: () => CanvasJSON | null;
  goForward: () => CanvasJSON | null;
  clearHistory: () => void;
  setSaveStatus: (status: SaveStatus) => void;
  setObjectCount: (count: number) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  history: [],
  historyIndex: -1,
  saveStatus: "saved",
  objectCount: 0,

  pushHistory: (snapshot) =>
    set((state) => {
      const truncated = state.history.slice(0, state.historyIndex + 1);
      const newHistory = [...truncated, snapshot];
      const trimmed = newHistory.length > MAX_HISTORY
        ? newHistory.slice(newHistory.length - MAX_HISTORY)
        : newHistory;
      return {
        history: trimmed,
        historyIndex: trimmed.length - 1,
        saveStatus: "unsaved",
      };
    }),

  goBack: () => {
    const { historyIndex, history } = get();
    if (historyIndex < 0 || history.length === 0) return null;
    if (historyIndex === 0) {
      set({ historyIndex: -1 });
      return null;
    }
    const newIndex = historyIndex - 1;
    set({ historyIndex: newIndex });
    return history[newIndex] ?? null;
  },

  goForward: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) {
      return null;
    }
    const newIndex = historyIndex + 1;
    set({ historyIndex: newIndex });
    return history[newIndex] ?? null;
  },

  clearHistory: () => set({ history: [], historyIndex: -1 }),

  setSaveStatus: (saveStatus) => set({ saveStatus }),

  setObjectCount: (objectCount) => set({ objectCount }),
}));
