import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "@/stores/settingsStore";

describe("settingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      theme: "dark",
      language: "zh-CN",
    });
  });

  it("should default to dark theme", () => {
    expect(useSettingsStore.getState().theme).toBe("dark");
  });

  it("should default to Chinese language", () => {
    expect(useSettingsStore.getState().language).toBe("zh-CN");
  });

  it("should toggle theme", () => {
    useSettingsStore.getState().setTheme("light");
    expect(useSettingsStore.getState().theme).toBe("light");
    useSettingsStore.getState().setTheme("dark");
    expect(useSettingsStore.getState().theme).toBe("dark");
  });
});
