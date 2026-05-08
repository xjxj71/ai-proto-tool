import { describe, it, expect } from "vitest";
import {
  serializeCanvas,
  createEmptyCanvasJSON,
  isCanvasJSONEmpty,
} from "@/utils/canvasSerializer";

describe("canvasSerializer", () => {
  it("should create empty canvas JSON with version", () => {
    const json = createEmptyCanvasJSON();
    expect(json.version).toBeDefined();
    expect(json.objects).toEqual([]);
  });

  it("should detect empty canvas JSON", () => {
    const json = createEmptyCanvasJSON();
    expect(isCanvasJSONEmpty(json)).toBe(true);
  });

  it("should detect non-empty canvas JSON", () => {
    const json = createEmptyCanvasJSON();
    json.objects = [{ type: "rect" }];
    expect(isCanvasJSONEmpty(json)).toBe(false);
  });

  it("should serialize canvas data to string", () => {
    const json = createEmptyCanvasJSON();
    const str = serializeCanvas(json);
    const parsed = JSON.parse(str);
    expect(parsed.version).toBeDefined();
    expect(parsed.objects).toEqual([]);
  });
});
