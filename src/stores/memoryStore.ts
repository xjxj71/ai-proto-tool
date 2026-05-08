import { create } from "zustand";

export interface UserPreferences {
  [key: string]: string;
}

export interface SavedModule {
  id: string;
  name: string;
  tags: string[];
  previewPath: string;
  templateHtml: string;
}

export interface ProjectContextData {
  designSystem: Record<string, string>;
  iterationLog: Array<{ timestamp: string; action: string; detail: string }>;
  glossary: Record<string, string>;
}

interface MemoryState {
  userPreferences: UserPreferences;
  savedModules: SavedModule[];
  projectContext: ProjectContextData | null;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  addSavedModule: (module: SavedModule) => void;
  removeSavedModule: (id: string) => void;
  setProjectContext: (context: ProjectContextData) => void;
  setPreferences: (prefs: UserPreferences) => void;
  setSavedModules: (modules: SavedModule[]) => void;
}

export const useMemoryStore = create<MemoryState>((set) => ({
  userPreferences: {},
  savedModules: [],
  projectContext: null,
  updatePreferences: (prefs) =>
    set((state) => {
      const merged: UserPreferences = { ...state.userPreferences };
      for (const [k, v] of Object.entries(prefs)) {
        if (v !== undefined) merged[k] = v;
      }
      return { userPreferences: merged };
    }),
  addSavedModule: (module) =>
    set((state) => ({
      savedModules: [...state.savedModules, module],
    })),
  removeSavedModule: (id) =>
    set((state) => ({
      savedModules: state.savedModules.filter((m) => m.id !== id),
    })),
  setProjectContext: (context) => set({ projectContext: context }),
  setPreferences: (prefs) => set({ userPreferences: prefs }),
  setSavedModules: (modules) => set({ savedModules: modules }),
}));
