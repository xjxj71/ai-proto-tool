import { describe, it, expect } from "vitest";
import type {
  ChatMessage,
  AIResponse,
  ProviderType,
  ChatStreamEvent,
} from "@/types";

describe("AI types", () => {
  it("should create a valid ChatMessage", () => {
    const msg: ChatMessage = {
      id: "msg-1",
      role: "user",
      content: "Hello",
      images: [],
      timestamp: "2026-01-01T00:00:00Z",
    };
    expect(msg.role).toBe("user");
    expect(msg.images).toEqual([]);
  });

  it("should create a valid assistant ChatMessage with canvas update", () => {
    const msg: ChatMessage = {
      id: "msg-2",
      role: "assistant",
      content: "Done",
      images: [],
      timestamp: "2026-01-01T00:00:00Z",
      canvasUpdated: true,
    };
    expect(msg.canvasUpdated).toBe(true);
  });

  it("should create a valid AIResponse", () => {
    const resp: AIResponse = {
      type: "generate",
      html: "<div>Hello</div>",
      css: ".hello { color: red; }",
      interactions: [],
      message: "Generated a prototype.",
    };
    expect(resp.type).toBe("generate");
    expect(resp.html).toBeDefined();
  });

  it("should accept all provider types", () => {
    const providers: ProviderType[] = [
      "openai", "anthropic", "gemini", "qwen", "deepseek",
      "moonshot", "doubao", "xiaomi", "zhipu", "custom",
    ];
    expect(providers).toHaveLength(10);
  });

  it("should create a valid ChatStreamEvent", () => {
    const event: ChatStreamEvent = {
      type: "delta",
      content: "Hello",
    };
    expect(event.type).toBe("delta");

    const doneEvent: ChatStreamEvent = { type: "done" };
    expect(doneEvent.type).toBe("done");

    const errorEvent: ChatStreamEvent = { type: "error", error: "Failed" };
    expect(errorEvent.error).toBe("Failed");
  });
});
