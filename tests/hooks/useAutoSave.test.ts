import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useCanvasStore } from "@/stores/canvasStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    useCanvasStore.setState({ saveStatus: "saved" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start with no pending save", () => {
    const { result } = renderHook(() =>
      useAutoSave({
        projectId: "proj-1",
        pageId: "page-1",
        enabled: true,
      })
    );
    expect(result.current.isPending).toBe(false);
  });

  it("should set saving status when triggered", () => {
    const { result } = renderHook(() =>
      useAutoSave({
        projectId: "proj-1",
        pageId: "page-1",
        enabled: true,
      })
    );

    act(() => {
      result.current.triggerSave('{"version":"6","objects":[]}');
    });

    expect(useCanvasStore.getState().saveStatus).toBe("unsaved");
  });

  it("should call invoke after debounce delay", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    const { result } = renderHook(() =>
      useAutoSave({
        projectId: "proj-1",
        pageId: "page-1",
        enabled: true,
        debounceMs: 1000,
      })
    );

    act(() => {
      result.current.triggerSave('{"version":"6","objects":[]}');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(invoke).toHaveBeenCalledWith("save_canvas_json", {
      projectId: "proj-1",
      pageId: "page-1",
      json: '{"version":"6","objects":[]}',
    });
  });

  it("should not save when disabled", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    const { result } = renderHook(() =>
      useAutoSave({
        projectId: "proj-1",
        pageId: "page-1",
        enabled: false,
        debounceMs: 1000,
      })
    );

    act(() => {
      result.current.triggerSave('{"version":"6","objects":[]}');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(invoke).not.toHaveBeenCalled();
  });

  it("should not save when pageId is empty", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    const { result } = renderHook(() =>
      useAutoSave({
        projectId: "proj-1",
        pageId: "",
        enabled: true,
        debounceMs: 1000,
      })
    );

    act(() => {
      result.current.triggerSave('{"version":"6","objects":[]}');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(invoke).not.toHaveBeenCalled();
  });
});
