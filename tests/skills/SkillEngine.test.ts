import { describe, it, expect } from "vitest";
import { SkillEngine } from "@/skills/SkillEngine";
import { SKILL_DEFINITIONS } from "@/skills/SkillRegistry";

describe("SkillEngine", () => {
  const engine = new SkillEngine(SKILL_DEFINITIONS);

  it("should match skill by keyword", () => {
    const result = engine.matchSkill("帮我设计一个落地页");
    expect(result).not.toBeNull();
    expect(result?.id).toBe("landing-page");
  });

  it("should match skill by @mention", () => {
    const result = engine.matchSkill("@dashboard 添加数据面板");
    expect(result).not.toBeNull();
    expect(result?.id).toBe("dashboard");
  });

  it("should return null for no match", () => {
    const result = engine.matchSkill("随便画个东西");
    expect(result).toBeNull();
  });

  it("should match dashboard keywords", () => {
    expect(engine.matchSkill("生成仪表盘")?.id).toBe("dashboard");
    expect(engine.matchSkill("后台管理")?.id).toBe("dashboard");
    expect(engine.matchSkill("数据面板")?.id).toBe("dashboard");
  });

  it("should match form-design keywords", () => {
    expect(engine.matchSkill("注册表单")?.id).toBe("form-design");
    expect(engine.matchSkill("登录页面")?.id).toBe("form-design");
  });

  it("should prioritize @mention over keywords", () => {
    const result = engine.matchSkill("@wireframe 做一个落地页");
    expect(result?.id).toBe("wireframe");
  });

  it("should build skill prompt", () => {
    const skill = engine.matchSkill("@landing-page");
    const prompt = engine.buildSkillPrompt(skill!);
    expect(prompt).toContain("landing-page");
    expect(prompt.length).toBeGreaterThan(50);
  });
});
