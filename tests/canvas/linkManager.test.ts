import { describe, it, expect } from "vitest";
import {
  addElementLink,
  removeElementLink,
  updateElementLink,
  getLinksForPage,
  getLinksForElement,
  type ElementLink,
} from "@/canvas/linkManager";

describe("linkManager", () => {
  const mockLinks: ElementLink[] = [
    { elementId: "el-1", targetPageId: "page-2", label: "商品详情" },
    { elementId: "el-2", targetPageId: "page-3", label: "购物车" },
    { elementId: "el-3", targetPageId: "page-2", label: "查看详情" },
  ];

  it("should add a new link to empty list", () => {
    const result = addElementLink([], "el-1", "page-2", "详情");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ elementId: "el-1", targetPageId: "page-2", label: "详情" });
  });

  it("should add a new link to existing list", () => {
    const result = addElementLink(mockLinks, "el-4", "page-5", "新链接");
    expect(result).toHaveLength(4);
    expect(result[3].elementId).toBe("el-4");
  });

  it("should replace existing link for same element", () => {
    const result = addElementLink(mockLinks, "el-1", "page-5", "新目标");
    expect(result).toHaveLength(3);
    const updated = result.find((l) => l.elementId === "el-1");
    expect(updated?.targetPageId).toBe("page-5");
    expect(updated?.label).toBe("新目标");
  });

  it("should remove a link by element id", () => {
    const result = removeElementLink(mockLinks, "el-2");
    expect(result).toHaveLength(2);
    expect(result.find((l) => l.elementId === "el-2")).toBeUndefined();
  });

  it("should update a link target", () => {
    const result = updateElementLink(mockLinks, "el-1", "page-9", "新标签");
    expect(result[0].targetPageId).toBe("page-9");
    expect(result[0].label).toBe("新标签");
  });

  it("should get links for a page (outgoing)", () => {
    const result = getLinksForPage(mockLinks);
    expect(result).toHaveLength(3);
  });

  it("should get link for a specific element", () => {
    const result = getLinksForElement(mockLinks, "el-1");
    expect(result).toEqual({ elementId: "el-1", targetPageId: "page-2", label: "商品详情" });
  });

  it("should return undefined for element without link", () => {
    const result = getLinksForElement(mockLinks, "el-999");
    expect(result).toBeUndefined();
  });
});
