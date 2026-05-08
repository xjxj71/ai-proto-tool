import { describe, it, expect, beforeEach } from "vitest";
import { useCanvasStore } from "@/stores/canvasStore";

describe("canvasStore", () => {
  beforeEach(() => {
    useCanvasStore.setState({
      history: [],
      historyIndex: -1,
      saveStatus: "saved",
      objectCount: 0,
    });
  });

  it("should start with empty history", () => {
    const state = useCanvasStore.getState();
    expect(state.history).toEqual([]);
    expect(state.historyIndex).toBe(-1);
  });

  it("should start with saved status", () => {
    expect(useCanvasStore.getState().saveStatus).toBe("saved");
  });

  it("should push to history and advance index", () => {
    const snapshot = { version: "6", objects: [] };
    useCanvasStore.getState().pushHistory(snapshot);
    expect(useCanvasStore.getState().history).toHaveLength(1);
    expect(useCanvasStore.getState().historyIndex).toBe(0);
  });

  it("should push multiple snapshots", () => {
    const s1 = { version: "6", objects: [{ type: "rect" }] };
    const s2 = { version: "6", objects: [{ type: "rect" }, { type: "circle" }] };
    useCanvasStore.getState().pushHistory(s1);
    useCanvasStore.getState().pushHistory(s2);
    expect(useCanvasStore.getState().history).toHaveLength(2);
    expect(useCanvasStore.getState().historyIndex).toBe(1);
  });

  it("should truncate future history on push after undo", () => {
    const s1 = { version: "6", objects: [] };
    const s2 = { version: "6", objects: [{ type: "rect" }] };
    const s3 = { version: "6", objects: [{ type: "circle" }] };
    useCanvasStore.getState().pushHistory(s1);
    useCanvasStore.getState().pushHistory(s2);
    useCanvasStore.getState().goBack();
    expect(useCanvasStore.getState().historyIndex).toBe(0);
    useCanvasStore.getState().pushHistory(s3);
    expect(useCanvasStore.getState().history).toHaveLength(2);
    expect(useCanvasStore.getState().historyIndex).toBe(1);
  });

  it("should go back in history", () => {
    const s1 = { version: "6", objects: [] };
    const s2 = { version: "6", objects: [{ type: "rect" }] };
    useCanvasStore.getState().pushHistory(s1);
    useCanvasStore.getState().pushHistory(s2);
    const result = useCanvasStore.getState().goBack();
    expect(result).toEqual(s1);
    expect(useCanvasStore.getState().historyIndex).toBe(0);
  });

  it("should go forward in history", () => {
    const s1 = { version: "6", objects: [] };
    const s2 = { version: "6", objects: [{ type: "rect" }] };
    useCanvasStore.getState().pushHistory(s1);
    useCanvasStore.getState().pushHistory(s2);
    useCanvasStore.getState().goBack();
    const result = useCanvasStore.getState().goForward();
    expect(result).toEqual(s2);
    expect(useCanvasStore.getState().historyIndex).toBe(1);
  });

  it("should return null when going back past start", () => {
    const result = useCanvasStore.getState().goBack();
    expect(result).toBeNull();
  });

  it("should return null when going forward past end", () => {
    const s1 = { version: "6", objects: [] };
    useCanvasStore.getState().pushHistory(s1);
    const result = useCanvasStore.getState().goForward();
    expect(result).toBeNull();
  });

  it("should set save status", () => {
    useCanvasStore.getState().setSaveStatus("saving");
    expect(useCanvasStore.getState().saveStatus).toBe("saving");
  });

  it("should set object count", () => {
    useCanvasStore.getState().setObjectCount(5);
    expect(useCanvasStore.getState().objectCount).toBe(5);
  });

  it("should clear history", () => {
    const s1 = { version: "6", objects: [] };
    useCanvasStore.getState().pushHistory(s1);
    useCanvasStore.getState().clearHistory();
    expect(useCanvasStore.getState().history).toEqual([]);
    expect(useCanvasStore.getState().historyIndex).toBe(-1);
  });

  it("should limit history to 50 entries", () => {
    for (let i = 0; i < 60; i++) {
      useCanvasStore.getState().pushHistory({ version: "6", objects: [{ type: "rect", id: i }] });
    }
    expect(useCanvasStore.getState().history.length).toBeLessThanOrEqual(50);
  });

  it("should track undo/redo availability via historyIndex", () => {
    expect(useCanvasStore.getState().historyIndex >= 0).toBe(false);
    expect(useCanvasStore.getState().historyIndex < useCanvasStore.getState().history.length - 1).toBe(false);

    const s1 = { version: "6", objects: [] };
    useCanvasStore.getState().pushHistory(s1);
    expect(useCanvasStore.getState().historyIndex >= 0).toBe(true);
    expect(useCanvasStore.getState().historyIndex < useCanvasStore.getState().history.length - 1).toBe(false);

    const result = useCanvasStore.getState().goBack();
    expect(result).toBeNull();
    expect(useCanvasStore.getState().historyIndex).toBe(0);
  });
});
