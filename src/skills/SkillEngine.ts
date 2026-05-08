import type { SkillDefinition } from "./SkillRegistry";

export class SkillEngine {
  private skills: SkillDefinition[];
  private skillMap: Map<string, SkillDefinition>;

  constructor(skills: SkillDefinition[]) {
    this.skills = skills;
    this.skillMap = new Map(skills.map((s) => [s.id, s]));
  }

  matchSkill(userInput: string): SkillDefinition | null {
    const trimmed = userInput.trim();

    const mentionMatch = trimmed.match(/@(\S+)/);
    if (mentionMatch) {
      const skillId = mentionMatch[1] ?? "";
      const skill = this.skillMap.get(skillId);
      if (skill) return skill;
    }

    let bestMatch: { skill: SkillDefinition; keywordLength: number } | null = null;
    for (const skill of this.skills) {
      for (const keyword of skill.keywords) {
        if (trimmed.includes(keyword)) {
          if (!bestMatch || keyword.length > bestMatch.keywordLength) {
            bestMatch = { skill, keywordLength: keyword.length };
          }
        }
      }
    }

    return bestMatch?.skill ?? null;
  }

  buildSkillPrompt(skill: SkillDefinition): string {
    return `[Skill: ${skill.name}]\n${skill.prompt}\n\n技能标识: ${skill.id}`;
  }

  getSkillById(id: string): SkillDefinition | undefined {
    return this.skillMap.get(id);
  }

  getAllSkills(): SkillDefinition[] {
    return [...this.skills];
  }
}
