import { describe, it, expect, beforeEach } from "vitest";
import { useProjectStore } from "@/stores/projectStore";

describe("projectStore", () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [],
      currentProject: null,
      pages: [],
    });
  });

  it("should start with empty projects list", () => {
    const state = useProjectStore.getState();
    expect(state.projects).toEqual([]);
    expect(state.currentProject).toBeNull();
  });

  it("should set projects", () => {
    const mockProject = {
      id: "test-id",
      name: "Test",
      description: "",
      coverImage: "",
      canvasPreset: "desktop_1440x900",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    useProjectStore.getState().setProjects([mockProject]);
    expect(useProjectStore.getState().projects).toHaveLength(1);
    expect(useProjectStore.getState().projects[0].name).toBe("Test");
  });

  it("should set current project", () => {
    const mockProject = {
      id: "test-id",
      name: "Test",
      description: "",
      coverImage: "",
      canvasPreset: "desktop_1440x900",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    useProjectStore.getState().setCurrentProject(mockProject);
    expect(useProjectStore.getState().currentProject?.id).toBe("test-id");
  });

  it("should clear current project", () => {
    useProjectStore.getState().setCurrentProject({
      id: "test",
      name: "Test",
      description: "",
      coverImage: "",
      canvasPreset: "desktop_1440x900",
      createdAt: "",
      updatedAt: "",
    });
    useProjectStore.getState().clearCurrentProject();
    expect(useProjectStore.getState().currentProject).toBeNull();
  });

  it("should set pages", () => {
    const mockPage = {
      id: "page-id",
      projectId: "proj-id",
      name: "Home",
      thumbnail: "",
      sortOrder: 0,
      canvasWidth: 1440,
      canvasHeight: 900,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    useProjectStore.getState().setPages([mockPage]);
    expect(useProjectStore.getState().pages).toHaveLength(1);
    expect(useProjectStore.getState().pages[0].name).toBe("Home");
  });
});
