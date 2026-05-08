import { useChatStore } from "@/stores/chatStore";

export function SkillBadge() {
  const activeSkill = useChatStore((s) => s.activeSkill);

  if (!activeSkill) return null;

  return (
    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      {activeSkill}
    </span>
  );
}
