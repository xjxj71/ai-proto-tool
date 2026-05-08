import { create } from "zustand";
import { addElementLink, removeElementLink, type ElementLink } from "@/canvas/linkManager";

interface LinkState {
  links: ElementLink[];
  selectedElementId: string | null;
  addLink: (elementId: string, targetPageId: string, label: string) => void;
  removeLink: (elementId: string) => void;
  setLinks: (links: ElementLink[]) => void;
  setSelectedElementId: (id: string | null) => void;
}

export const useLinkStore = create<LinkState>((set) => ({
  links: [],
  selectedElementId: null,
  addLink: (elementId, targetPageId, label) =>
    set((state) => ({ links: addElementLink(state.links, elementId, targetPageId, label) })),
  removeLink: (elementId) =>
    set((state) => ({ links: removeElementLink(state.links, elementId) })),
  setLinks: (links) => set({ links }),
  setSelectedElementId: (id) => set({ selectedElementId: id }),
}));
