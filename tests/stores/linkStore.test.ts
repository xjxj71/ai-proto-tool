import { describe, it, expect, beforeEach } from "vitest";
import { useLinkStore } from "@/stores/linkStore";

describe("linkStore", () => {
  beforeEach(() => {
    useLinkStore.setState({ links: [], selectedElementId: null });
  });

  it("should start with empty links", () => {
    expect(useLinkStore.getState().links).toEqual([]);
  });

  it("should add a link", () => {
    useLinkStore.getState().addLink("el-1", "page-2", "详情");
    expect(useLinkStore.getState().links).toHaveLength(1);
  });

  it("should remove a link", () => {
    useLinkStore.getState().addLink("el-1", "page-2", "详情");
    useLinkStore.getState().removeLink("el-1");
    expect(useLinkStore.getState().links).toHaveLength(0);
  });

  it("should set selected element", () => {
    useLinkStore.getState().setSelectedElementId("el-1");
    expect(useLinkStore.getState().selectedElementId).toBe("el-1");
  });
});
