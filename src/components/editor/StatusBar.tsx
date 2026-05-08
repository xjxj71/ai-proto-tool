import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/stores/projectStore";

export function StatusBar() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const pages = useProjectStore((s) => s.pages);

  const currentPage = pages.length > 0 ? pages[0] : null;

  return (
    <div className="h-6 bg-bg-secondary border-t border-border flex items-center px-3 text-xs text-text-muted select-none">
      {currentPage && (
        <>
          <span>
            {t("editor.status.page")}: {currentPage.name}
          </span>
          <span className="mx-2">|</span>
          <span>
            {t("editor.status.canvasSize")}: {currentPage.canvasWidth}x{currentPage.canvasHeight}
          </span>
          <span className="mx-2">|</span>
        </>
      )}
      <span>{t("editor.status.saved")}</span>
      <div className="flex-1" />
      {currentProject && (
        <span className="text-text-muted">{currentProject.name}</span>
      )}
    </div>
  );
}
