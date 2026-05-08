import { describe, it, expect } from "vitest";
import {
  wrapPrototypeHTML,
  extractInlineCSS,
  buildPrototypeIframeSrc,
} from "@/components/ai/PrototypeRenderer";

describe("PrototypeRenderer", () => {
  describe("wrapPrototypeHTML", () => {
    it("should wrap HTML in a full document with CSS", () => {
      const html = '<div class="prototype"><h1>Hello</h1></div>';
      const css = ".prototype { padding: 20px; }";
      const result = wrapPrototypeHTML(html, css);
      expect(result).toContain("<!DOCTYPE html>");
      expect(result).toContain("<style>");
      expect(result).toContain(css);
      expect(result).toContain(html);
    });

    it("should include CSS reset", () => {
      const result = wrapPrototypeHTML("<div>test</div>", "");
      expect(result).toContain("margin: 0");
      expect(result).toContain("padding: 0");
    });
  });

  describe("extractInlineCSS", () => {
    it("should extract CSS from style tags in HTML", () => {
      const html = '<style>.btn { color: red; }</style><div class="btn">Click</div>';
      const { css, cleanHtml } = extractInlineCSS(html);
      expect(css).toContain(".btn { color: red; }");
      expect(cleanHtml).not.toContain("<style>");
      expect(cleanHtml).toContain("Click");
    });

    it("should handle HTML without style tags", () => {
      const html = "<div>No styles here</div>";
      const { css, cleanHtml } = extractInlineCSS(html);
      expect(css).toBe("");
      expect(cleanHtml).toBe(html);
    });
  });

  describe("buildPrototypeIframeSrc", () => {
    it("should create a data URL for iframe src", () => {
      const html = "<div>Hello</div>";
      const css = "div { color: blue; }";
      const src = buildPrototypeIframeSrc(html, css);
      expect(src).toMatch(/^data:text\/html;base64,/);
    });

    it("should be decodable", () => {
      const html = "<div>Test Content</div>";
      const css = ".test { color: red; }";
      const src = buildPrototypeIframeSrc(html, css);
      const base64Part = src.replace("data:text/html;base64,", "");
      const decoded = atob(base64Part);
      expect(decoded).toContain("Test Content");
      expect(decoded).toContain(".test { color: red; }");
    });
  });
});
