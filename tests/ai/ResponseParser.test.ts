import { describe, it, expect } from "vitest";
import { parseAIResponse, extractJSONFromMarkdown } from "@/components/ai/ResponseParser";

describe("ResponseParser", () => {
  describe("extractJSONFromMarkdown", () => {
    it("should extract JSON from markdown code block", () => {
      const input = 'Here is the result:\n```json\n{"type":"generate","html":"<div>Hi</div>","css":"","interactions":[],"message":"Done"}\n```\nDone!';
      const result = extractJSONFromMarkdown(input);
      expect(result).toBeDefined();
      expect(result!.type).toBe("generate");
    });

    it("should return null when no JSON block found", () => {
      const input = "Just plain text without any JSON";
      const result = extractJSONFromMarkdown(input);
      expect(result).toBeNull();
    });

    it("should extract JSON from non-markdown raw JSON string", () => {
      const input = '{"type":"modify","html":"<p>Changed</p>","css":"","interactions":[],"message":"Updated"}';
      const result = extractJSONFromMarkdown(input);
      expect(result).toBeDefined();
      expect(result!.type).toBe("modify");
    });

    it("should handle JSON in code block without language tag", () => {
      const input = '```\n{"type":"generate","html":"","css":"","interactions":[],"message":"ok"}\n```';
      const result = extractJSONFromMarkdown(input);
      expect(result).toBeDefined();
      expect(result!.type).toBe("generate");
    });
  });

  describe("parseAIResponse", () => {
    it("should parse a complete AI response with JSON block", () => {
      const raw = 'Here is the prototype:\n```json\n{"type":"generate","html":"<div class=\\"app\\">Hello</div>","css":".app{padding:20px}","interactions":[{"element":"#btn","action":"navigate","target":"page-2"}],"message":"Generated a landing page."}\n```\nLet me know if you want changes.';
      const result = parseAIResponse(raw);
      expect(result.response!.type).toBe("generate");
      expect(result.response!.html).toContain("Hello");
      expect(result.response!.interactions).toHaveLength(1);
      expect(result.replyText).toContain("Generated a landing page.");
    });

    it("should handle pure text response without JSON", () => {
      const raw = "I need more details about what you want to build.";
      const result = parseAIResponse(raw);
      expect(result.response).toBeNull();
      expect(result.replyText).toBe(raw);
    });

    it("should handle response with only message field", () => {
      const raw = '```json\n{"type":"generate","html":"","css":"","interactions":[],"message":"No changes needed."}\n```';
      const result = parseAIResponse(raw);
      expect(result.response).toBeDefined();
      expect(result.response!.message).toBe("No changes needed.");
      expect(result.replyText).toBe("No changes needed.");
    });

    it("should extract memory updates when present", () => {
      const raw = '```json\n{"type":"generate","html":"<div></div>","css":"","interactions":[],"message":"ok","memoryUpdates":{"preferences":{"style":"minimal"}}}\n```';
      const result = parseAIResponse(raw);
      expect(result.response!.memoryUpdates).toBeDefined();
      expect(result.response!.memoryUpdates!.preferences!.style).toBe("minimal");
    });

    it("should extract skill used when present", () => {
      const raw = '```json\n{"type":"generate","html":"<div></div>","css":"","interactions":[],"message":"ok","skillUsed":"landing-page"}\n```';
      const result = parseAIResponse(raw);
      expect(result.response!.skillUsed).toBe("landing-page");
    });
  });
});
