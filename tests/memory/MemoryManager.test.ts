import { describe, it, expect } from "vitest";
import { MemoryManager } from "@/memory/MemoryManager";

describe("MemoryManager", () => {
  it("should extract memory updates from AI response", () => {
    const manager = new MemoryManager();
    const result = manager.extractMemoryUpdates({
      memory_updates: {
        preferences: { style: "简约" },
        design_system: { primary_color: "#7c6aef" },
      },
    });
    expect(result.preferences).toEqual({ style: "简约" });
    expect(result.designSystem).toEqual({ primary_color: "#7c6aef" });
  });

  it("should handle missing memory_updates", () => {
    const manager = new MemoryManager();
    const result = manager.extractMemoryUpdates({});
    expect(result.preferences).toEqual({});
    expect(result.designSystem).toEqual({});
  });

  it("should handle partial memory_updates", () => {
    const manager = new MemoryManager();
    const result = manager.extractMemoryUpdates({
      memory_updates: { preferences: { layout: "侧边导航" } },
    });
    expect(result.preferences).toEqual({ layout: "侧边导航" });
    expect(result.designSystem).toEqual({});
  });
});
