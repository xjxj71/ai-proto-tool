import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  buildCanvasContext,
  buildConversationMessages,
} from "@/components/ai/ContextBuilder";
import type { ChatMessage } from "@/types";

describe("ContextBuilder", () => {
  describe("buildSystemPrompt", () => {
    it("should return a non-empty system prompt", () => {
      const prompt = buildSystemPrompt();
      expect(prompt.length).toBeGreaterThan(100);
      expect(prompt).toContain("prototype");
      expect(prompt).toContain("HTML");
      expect(prompt).toContain("CSS");
    });

    it("should include output format specification", () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain("JSON");
      expect(prompt).toContain("generate");
      expect(prompt).toContain("modify");
    });

    it("should include canvas dimensions when provided", () => {
      const prompt = buildSystemPrompt({ canvasWidth: 1440, canvasHeight: 900 });
      expect(prompt).toContain("1440");
      expect(prompt).toContain("900");
    });
  });

  describe("buildCanvasContext", () => {
    it("should return description with canvas state", () => {
      const context = buildCanvasContext({
        canvasJSON: '{"version":"6","objects":[{"type":"rect"}]}',
        canvasWidth: 1440,
        canvasHeight: 900,
      });
      expect(context).toContain("1440x900");
      expect(context).toContain("1 object");
    });

    it("should return empty state description for empty canvas", () => {
      const context = buildCanvasContext({
        canvasJSON: '{"version":"6","objects":[]}',
        canvasWidth: 1440,
        canvasHeight: 900,
      });
      expect(context).toContain("empty");
      expect(context).toContain("1440x900");
    });

    it("should include screenshot description when provided", () => {
      const context = buildCanvasContext({
        canvasJSON: '{"version":"6","objects":[]}',
        canvasWidth: 800,
        canvasHeight: 600,
        screenshotDataUrl: "data:image/png;base64,abc123",
      });
      expect(context).toContain("screenshot");
    });
  });

  describe("buildConversationMessages", () => {
    it("should convert chat messages to API format with text content", () => {
      const messages: ChatMessage[] = [
        { id: "1", role: "user", content: "Hello", images: [], timestamp: "2026-01-01" },
        { id: "2", role: "assistant", content: "Hi there", images: [], timestamp: "2026-01-01" },
      ];
      const result = buildConversationMessages(messages);
      expect(result).toHaveLength(2);
      expect(result[0].role).toBe("user");
    });

    it("should include images as content parts when present", () => {
      const messages: ChatMessage[] = [
        {
          id: "1",
          role: "user",
          content: "Look at this",
          images: ["data:image/png;base64,abc"],
          timestamp: "2026-01-01",
        },
      ];
      const result = buildConversationMessages(messages);
      expect(result[0].content).toBeInstanceOf(Array);
      const parts = result[0].content as Array<{ type: string }>;
      expect(parts).toHaveLength(2);
      expect(parts[0].type).toBe("text");
      expect(parts[1].type).toBe("image_url");
    });

    it("should limit to last 20 messages", () => {
      const messages: ChatMessage[] = Array.from({ length: 30 }, (_, i) => ({
        id: `msg-${i}`,
        role: "user" as const,
        content: `Message ${i}`,
        images: [] as string[],
        timestamp: "2026-01-01",
      }));
      const result = buildConversationMessages(messages);
      expect(result).toHaveLength(20);
    });
  });
});
