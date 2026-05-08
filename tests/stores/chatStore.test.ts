import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore, compressHistory } from "@/stores/chatStore";

describe("chatStore", () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: [],
      streamingContent: "",
      isStreaming: false,
      streamingState: "idle",
      activeRequestId: "",
      activeSkill: "",
      abortController: null,
    });
  });

  it("should start with empty messages", () => {
    expect(useChatStore.getState().messages).toEqual([]);
  });

  it("should add a user message", () => {
    useChatStore.getState().addMessage({
      id: "msg-1",
      role: "user",
      content: "Hello",
      images: [],
      timestamp: new Date().toISOString(),
    });
    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().messages[0].content).toBe("Hello");
  });

  it("should start streaming", () => {
    useChatStore.getState().startStreaming("req-1");
    expect(useChatStore.getState().isStreaming).toBe(true);
    expect(useChatStore.getState().activeRequestId).toBe("req-1");
    expect(useChatStore.getState().streamingContent).toBe("");
  });

  it("should append streaming content", () => {
    useChatStore.getState().startStreaming("req-1");
    useChatStore.getState().appendStreamContent("Hello ");
    useChatStore.getState().appendStreamContent("World");
    expect(useChatStore.getState().streamingContent).toBe("Hello World");
  });

  it("should stop streaming and finalize as assistant message", () => {
    useChatStore.getState().startStreaming("req-1");
    useChatStore.getState().appendStreamContent("AI response");
    useChatStore.getState().stopStreaming(true);

    expect(useChatStore.getState().isStreaming).toBe(false);
    expect(useChatStore.getState().streamingContent).toBe("");
    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().messages[0].role).toBe("assistant");
    expect(useChatStore.getState().messages[0].content).toBe("AI response");
  });

  it("should stop streaming without adding message when cancelled", () => {
    useChatStore.getState().startStreaming("req-1");
    useChatStore.getState().appendStreamContent("Partial");
    useChatStore.getState().stopStreaming(false);

    expect(useChatStore.getState().isStreaming).toBe(false);
    expect(useChatStore.getState().messages).toHaveLength(0);
  });

  it("should set active skill", () => {
    useChatStore.getState().setActiveSkill("landing-page");
    expect(useChatStore.getState().activeSkill).toBe("landing-page");
  });

  it("should track streaming state transitions", () => {
    expect(useChatStore.getState().streamingState).toBe("idle");

    useChatStore.getState().startStreaming("req-1");
    expect(useChatStore.getState().streamingState).toBe("streaming");

    useChatStore.getState().setStreamingState("error");
    expect(useChatStore.getState().streamingState).toBe("error");

    useChatStore.getState().stopStreaming(false);
    expect(useChatStore.getState().streamingState).toBe("idle");
  });

  it("should manage abort controller", () => {
    const controller = new AbortController();
    useChatStore.getState().setAbortController(controller);
    expect(useChatStore.getState().abortController).toBe(controller);

    useChatStore.getState().setAbortController(null);
    expect(useChatStore.getState().abortController).toBeNull();
  });

  it("should clear messages for page switch", () => {
    useChatStore.getState().addMessage({
      id: "msg-1",
      role: "user",
      content: "Test",
      images: [],
      timestamp: new Date().toISOString(),
    });
    useChatStore.getState().clearMessages();
    expect(useChatStore.getState().messages).toEqual([]);
  });

  it("should set messages from loaded history", () => {
    const msgs = [
      { id: "m1", role: "user" as const, content: "Hi", images: [] as string[], timestamp: "2026-01-01" },
    ];
    useChatStore.getState().setMessages(msgs);
    expect(useChatStore.getState().messages).toHaveLength(1);
  });
});

describe("compressHistory", () => {
  it("should not compress when under limit", () => {
    const messages = Array.from({ length: 10 }, (_, i) => ({
      id: `msg-${i}`,
      role: (i % 2 === 0 ? "user" : "assistant") as const,
      content: `Message ${i}`,
      images: [] as string[],
      timestamp: new Date().toISOString(),
    }));
    const result = compressHistory(messages, 20);
    expect(result).toHaveLength(10);
  });

  it("should compress when over limit", () => {
    const messages = Array.from({ length: 50 }, (_, i) => ({
      id: `msg-${i}`,
      role: (i % 2 === 0 ? "user" : "assistant") as const,
      content: `Message ${i}`,
      images: [] as string[],
      timestamp: new Date().toISOString(),
    }));
    const result = compressHistory(messages, 10);
    expect(result[0].role).toBe("system");
    expect(result[0].content).toContain("[历史摘要]");
    expect(result).toHaveLength(21);
  });
});
