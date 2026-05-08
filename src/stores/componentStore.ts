import { create } from "zustand";

export interface ComponentTemplate {
  id: string;
  name: string;
  tags: string[];
  previewPath: string;
  templateData: string;
  isBuiltIn?: boolean;
}

interface ComponentState {
  builtInComponents: ComponentTemplate[];
  customComponents: ComponentTemplate[];
  searchQuery: string;
  addCustomComponent: (component: ComponentTemplate) => void;
  removeCustomComponent: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setCustomComponents: (components: ComponentTemplate[]) => void;
  setBuiltInComponents: (components: ComponentTemplate[]) => void;
}

export const useComponentStore = create<ComponentState>((set) => ({
  builtInComponents: [],
  customComponents: [],
  searchQuery: "",
  addCustomComponent: (component) =>
    set((state) => ({
      customComponents: [...state.customComponents, component],
    })),
  removeCustomComponent: (id) =>
    set((state) => ({
      customComponents: state.customComponents.filter((c) => c.id !== id),
    })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCustomComponents: (components) => set({ customComponents: components }),
  setBuiltInComponents: (components) => set({ builtInComponents: components }),
}));
