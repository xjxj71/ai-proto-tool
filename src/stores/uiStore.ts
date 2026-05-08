import { create } from "zustand";

export type ToolType = "select" | "pen" | "rectangle" | "text";
export type ViewType = "welcome" | "editor";

interface UiState {
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  activeTool: ToolType;
  view: ViewType;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setActiveTool: (tool: ToolType) => void;
  setView: (view: ViewType) => void;
}

export const useUiStore = create<UiState>((set) => ({
  leftPanelVisible: true,
  rightPanelVisible: true,
  activeTool: "select",
  view: "welcome",
  toggleLeftPanel: () => set((state) => ({ leftPanelVisible: !state.leftPanelVisible })),
  toggleRightPanel: () => set((state) => ({ rightPanelVisible: !state.rightPanelVisible })),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setView: (view) => set({ view }),
}));
