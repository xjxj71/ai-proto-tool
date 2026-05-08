import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-1.5 px-2 py-1 rounded text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
      aria-label={theme === "dark" ? t("settings.light") : t("settings.dark")}
    >
      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
      {theme === "dark" ? t("settings.light") : t("settings.dark")}
    </button>
  );
}
