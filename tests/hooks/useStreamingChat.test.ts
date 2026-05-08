import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { useChatStore } from "@/stores/chatStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

describe("useStreamingChat", () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: [],
      streamingContent: "",
      isStreaming: false,
      activeRequestId: "",
    });
  });

  it("should provide a send function", () => {
    const { result } = renderHook(() =>
      useStreamingChat({
        projectId: "proj-1",
        pageId: "page-1",
      })
    );
    expect(result.current.send).toBeInstanceOf(Function);
  });

  it("should provide a cancel function", () => {
    const { result } = renderHook(() =>
      useStreamingChat({
        projectId: "proj-1",
        pageId: "page-1",
      })
    );
    expect(result.current.cancel).toBeInstanceOf(Function);
  });

  it("should add user message to store on send", async () => {
    const { result } = renderHook(() =>
      useStreamingChat({
        projectId: "proj-1",
        pageId: "page-1",
      })
    );

    await act(async () => {
      await result.current.send("Build a landing page", []);
    });

    const state = useChatStore.getState();
    const userMsg = state.messages.find((m) => m.role === "user");
    expect(userMsg).toBeDefined();
    expect(userMsg!.content).toBe("Build a landing page");
  });

  it("should not send when no model is configured", async () => {
    const { result } = renderHook(() =>
      useStreamingChat({
        projectId: "proj-1",
        pageId: "page-1",
      })
    );

    await act(async () => {
      await result.current.send("Test", []);
    });

    expect(useChatStore.getState().isStreaming).toBe(false);
  });

  it("should expose loading state", () => {
    const { result } = renderHook(() =>
      useStreamingChat({
        projectId: "proj-1",
        pageId: "page-1",
      })
    );
    expect(typeof result.current.isLoading).toBe("boolean");
  });
});
