import { create } from "zustand";
import type { CanvasMode } from "@/types";

export type ToolType = "select" | "pen" | "rectangle" | "text";
export type ViewType = "welcome" | "editor" | "settings";

interface UiState {
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  activeTool: ToolType;
  view: ViewType;
  canvasMode: CanvasMode;
  gridVisible: boolean;
  currentPageId: string;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setActiveTool: (tool: ToolType) => void;
  setView: (view: ViewType) => void;
  setCanvasMode: (mode: CanvasMode) => void;
  toggleGrid: () => void;
  setCurrentPageId: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  leftPanelVisible: true,
  rightPanelVisible: true,
  activeTool: "select",
  view: "welcome",
  canvasMode: "design",
  gridVisible: true,
  currentPageId: "",
  toggleLeftPanel: () => set((state) => ({ leftPanelVisible: !state.leftPanelVisible })),
  toggleRightPanel: () => set((state) => ({ rightPanelVisible: !state.rightPanelVisible })),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setView: (view) => set({ view }),
  setCanvasMode: (canvasMode) => set({ canvasMode }),
  toggleGrid: () => set((state) => ({ gridVisible: !state.gridVisible })),
  setCurrentPageId: (currentPageId) => set({ currentPageId }),
}));
