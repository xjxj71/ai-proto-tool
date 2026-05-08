import { create } from "zustand";
import type { Project, Page } from "@/types";

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  pages: Page[];
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project) => void;
  clearCurrentProject: () => void;
  setPages: (pages: Page[]) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  pages: [],
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  clearCurrentProject: () => set({ currentProject: null, pages: [] }),
  setPages: (pages) => set({ pages }),
}));
