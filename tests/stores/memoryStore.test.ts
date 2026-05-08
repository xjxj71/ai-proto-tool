import { describe, it, expect, beforeEach } from "vitest";
import { useMemoryStore } from "@/stores/memoryStore";

describe("memoryStore", () => {
  beforeEach(() => {
    useMemoryStore.setState({
      userPreferences: {},
      savedModules: [],
      projectContext: null,
    });
  });

  it("should start with empty preferences", () => {
    expect(useMemoryStore.getState().userPreferences).toEqual({});
  });

  it("should update user preferences", () => {
    useMemoryStore.getState().updatePreferences({ style: "简约", layout: "侧边导航" });
    const prefs = useMemoryStore.getState().userPreferences;
    expect(prefs.style).toBe("简约");
    expect(prefs.layout).toBe("侧边导航");
  });

  it("should merge preferences partially", () => {
    useMemoryStore.getState().updatePreferences({ style: "简约" });
    useMemoryStore.getState().updatePreferences({ layout: "顶部导航" });
    const prefs = useMemoryStore.getState().userPreferences;
    expect(prefs.style).toBe("简约");
    expect(prefs.layout).toBe("顶部导航");
  });

  it("should add saved module", () => {
    useMemoryStore.getState().addSavedModule({
      id: "mod-1",
      name: "统计卡片",
      tags: ["dashboard", "card"],
      previewPath: "",
      templateHtml: "<div>...</div>",
    });
    expect(useMemoryStore.getState().savedModules).toHaveLength(1);
  });

  it("should remove saved module", () => {
    useMemoryStore.getState().addSavedModule({
      id: "mod-1",
      name: "统计卡片",
      tags: ["card"],
      previewPath: "",
      templateHtml: "",
    });
    useMemoryStore.getState().removeSavedModule("mod-1");
    expect(useMemoryStore.getState().savedModules).toHaveLength(0);
  });

  it("should set project context", () => {
    useMemoryStore.getState().setProjectContext({
      designSystem: { primaryColor: "#7c6aef", fontFamily: "sans-serif" },
      iterationLog: [],
      glossary: {},
    });
    expect(useMemoryStore.getState().projectContext).not.toBeNull();
    expect(useMemoryStore.getState().projectContext?.designSystem.primaryColor).toBe("#7c6aef");
  });
});
