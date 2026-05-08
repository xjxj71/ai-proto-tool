import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "@/stores/uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    useUiStore.setState({
      leftPanelVisible: true,
      rightPanelVisible: true,
      activeTool: "select",
      view: "welcome",
      canvasMode: "design",
      gridVisible: true,
      currentPageId: "",
    });
  });

  it("should default to showing both panels", () => {
    expect(useUiStore.getState().leftPanelVisible).toBe(true);
    expect(useUiStore.getState().rightPanelVisible).toBe(true);
  });

  it("should toggle left panel", () => {
    useUiStore.getState().toggleLeftPanel();
    expect(useUiStore.getState().leftPanelVisible).toBe(false);
    useUiStore.getState().toggleLeftPanel();
    expect(useUiStore.getState().leftPanelVisible).toBe(true);
  });

  it("should toggle right panel", () => {
    useUiStore.getState().toggleRightPanel();
    expect(useUiStore.getState().rightPanelVisible).toBe(false);
  });

  it("should set active tool", () => {
    useUiStore.getState().setActiveTool("pen");
    expect(useUiStore.getState().activeTool).toBe("pen");
  });

  it("should switch view between welcome and editor", () => {
    useUiStore.getState().setView("editor");
    expect(useUiStore.getState().view).toBe("editor");
    useUiStore.getState().setView("welcome");
    expect(useUiStore.getState().view).toBe("welcome");
  });

  it("should default to design canvas mode", () => {
    expect(useUiStore.getState().canvasMode).toBe("design");
  });

  it("should set canvas mode", () => {
    useUiStore.getState().setCanvasMode("sketch");
    expect(useUiStore.getState().canvasMode).toBe("sketch");
    useUiStore.getState().setCanvasMode("design");
    expect(useUiStore.getState().canvasMode).toBe("design");
  });

  it("should toggle grid visibility", () => {
    const initial = useUiStore.getState().gridVisible;
    useUiStore.getState().toggleGrid();
    expect(useUiStore.getState().gridVisible).toBe(!initial);
  });

  it("should store current page id", () => {
    useUiStore.getState().setCurrentPageId("page-123");
    expect(useUiStore.getState().currentPageId).toBe("page-123");
  });
});
