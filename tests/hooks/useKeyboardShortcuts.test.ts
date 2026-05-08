import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useUiStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";

function fireKeyDown(key: string, opts: Partial<KeyboardEventInit> = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    ...opts,
  });
  window.dispatchEvent(event);
}

describe("useKeyboardShortcuts", () => {
  let getCanvas: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getCanvas = vi.fn().mockReturnValue(null);
    useUiStore.setState({
      activeTool: "select",
      leftPanelVisible: true,
      rightPanelVisible: true,
    });
    useCanvasStore.setState({
      history: [],
      historyIndex: -1,
      saveStatus: "saved",
    });
  });

  it("switches tool on V/B/R/T keys", () => {
    renderHook(() => useKeyboardShortcuts({ getCanvas }));

    fireKeyDown("b");
    expect(useUiStore.getState().activeTool).toBe("pen");

    fireKeyDown("r");
    expect(useUiStore.getState().activeTool).toBe("rectangle");

    fireKeyDown("t");
    expect(useUiStore.getState().activeTool).toBe("text");

    fireKeyDown("v");
    expect(useUiStore.getState().activeTool).toBe("select");
  });

  it("ignores shortcuts when focused on input", () => {
    renderHook(() => useKeyboardShortcuts({ getCanvas }));

    const input = document.createElement("input");
    vi.spyOn(input, "tagName", "get").mockReturnValue("INPUT");
    Object.defineProperty(input, "isContentEditable", { value: false });

    const event = new KeyboardEvent("keydown", { key: "b", bubbles: true });
    Object.defineProperty(event, "target", { value: input, writable: false });

    window.dispatchEvent(event);
    expect(useUiStore.getState().activeTool).toBe("select");
  });

  it("toggles left panel on Ctrl+1", () => {
    renderHook(() => useKeyboardShortcuts({ getCanvas }));

    expect(useUiStore.getState().leftPanelVisible).toBe(true);
    fireKeyDown("1", { ctrlKey: true });
    expect(useUiStore.getState().leftPanelVisible).toBe(false);
  });

  it("toggles right panel on Ctrl+3", () => {
    renderHook(() => useKeyboardShortcuts({ getCanvas }));

    expect(useUiStore.getState().rightPanelVisible).toBe(true);
    fireKeyDown("3", { ctrlKey: true });
    expect(useUiStore.getState().rightPanelVisible).toBe(false);
  });

  it("marks unsaved on Ctrl+S", () => {
    renderHook(() => useKeyboardShortcuts({ getCanvas }));

    expect(useCanvasStore.getState().saveStatus).toBe("saved");
    fireKeyDown("s", { ctrlKey: true });
    expect(useCanvasStore.getState().saveStatus).toBe("unsaved");
  });

  it("deletes active objects on Delete/Backspace", () => {
    const mockRemove = vi.fn();
    const mockDiscard = vi.fn();
    const mockRenderAll = vi.fn();
    const mockGetActiveObjects = vi.fn().mockReturnValue([{ name: "obj1" }]);

    const canvas = {
      getActiveObjects: mockGetActiveObjects,
      remove: mockRemove,
      discardActiveObject: mockDiscard,
      renderAll: mockRenderAll,
    };
    getCanvas.mockReturnValue(canvas);

    renderHook(() => useKeyboardShortcuts({ getCanvas }));

    fireKeyDown("Delete");
    expect(mockRemove).toHaveBeenCalled();
    expect(mockDiscard).toHaveBeenCalled();
  });

  it("cleans up event listener on unmount", () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts({ getCanvas }));

    unmount();

    fireKeyDown("v");
    expect(useUiStore.getState().activeTool).toBe("select");
  });
});
