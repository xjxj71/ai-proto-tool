import { useTranslation } from "react-i18next";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";

export function MenuBar() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const setView = useUiStore((s) => s.setView);
  const clearCurrentProject = useProjectStore((s) => s.clearCurrentProject);

  const handleBackToWelcome = () => {
    clearCurrentProject();
    setView("welcome");
  };

  return (
    <div className="h-8 bg-bg-secondary border-b border-border flex items-center px-3 text-xs select-none">
      <button
        onClick={handleBackToWelcome}
        className="text-text-secondary hover:text-text-primary mr-3 transition-colors"
      >
        {currentProject?.name ?? "AI-Proto-Tool"}
      </button>
      <span className="text-text-muted mx-1">|</span>
      {(["file", "edit", "view", "export"] as const).map((menu) => (
        <button
          key={menu}
          className="px-2 py-0.5 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
        >
          {t(`editor.menu.${menu}`)}
        </button>
      ))}
      <div className="flex-1" />
      <ThemeToggle />
    </div>
  );
}
