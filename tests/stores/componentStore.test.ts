import { describe, it, expect, beforeEach } from "vitest";
import { useComponentStore } from "@/stores/componentStore";

describe("componentStore", () => {
  beforeEach(() => {
    useComponentStore.setState({ customComponents: [], searchQuery: "" });
  });

  it("should start with empty custom components", () => {
    expect(useComponentStore.getState().customComponents).toEqual([]);
  });

  it("should add custom component", () => {
    useComponentStore.getState().addCustomComponent({
      id: "comp-1",
      name: "我的卡片",
      tags: ["card"],
      previewPath: "",
      templateData: "{}",
    });
    expect(useComponentStore.getState().customComponents).toHaveLength(1);
  });

  it("should remove custom component", () => {
    useComponentStore.getState().addCustomComponent({
      id: "comp-1",
      name: "我的卡片",
      tags: ["card"],
      previewPath: "",
      templateData: "{}",
    });
    useComponentStore.getState().removeCustomComponent("comp-1");
    expect(useComponentStore.getState().customComponents).toHaveLength(0);
  });

  it("should set search query", () => {
    useComponentStore.getState().setSearchQuery("导航");
    expect(useComponentStore.getState().searchQuery).toBe("导航");
  });
});
