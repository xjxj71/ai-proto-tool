import { describe, it, expect } from "vitest";
import i18n from "@/i18n";

describe("i18n configuration", () => {
  it("should have zh-CN as default language", () => {
    expect(i18n.language).toBe("zh-CN");
  });

  it("should translate app name", () => {
    expect(i18n.t("app.name")).toBe("AI-Proto-Tool");
  });

  it("should translate welcome title", () => {
    expect(i18n.t("welcome.title")).toBe("欢迎使用 AI-Proto-Tool");
  });

  it("should translate editor menu items", () => {
    expect(i18n.t("editor.menu.file")).toBe("文件");
    expect(i18n.t("editor.menu.edit")).toBe("编辑");
  });
});
