import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { useLinkStore } from "@/stores/linkStore";

export function StatusBar() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const pages = useProjectStore((s) => s.pages);
  const currentPageId = useUiStore((s) => s.currentPageId);
  const canvasMode = useUiStore((s) => s.canvasMode);
  const saveStatus = useCanvasStore((s) => s.saveStatus);
  const objectCount = useCanvasStore((s) => s.objectCount);
  const linkCount = useLinkStore((s) => s.links.length);

  const currentPage = pages.find((p) => p.id === currentPageId);

  const saveStatusLabel = (() => {
    switch (saveStatus) {
      case "saved": return t("editor.status.saved");
      case "saving": return t("editor.status.saving");
      case "unsaved": return t("editor.status.unsaved");
    }
  })();

  const saveStatusColor = (() => {
    switch (saveStatus) {
      case "saved": return "text-success";
      case "saving": return "text-warning";
      case "unsaved": return "text-danger";
    }
  })();

  return (
    <div className="h-6 bg-bg-secondary border-t border-border flex items-center px-3 text-xs text-text-muted select-none">
      {currentPage && (
        <>
          <span>
            {t("editor.status.page")}: {currentPage.name}
          </span>
          <span className="mx-2">|</span>
          <span>
            {t("editor.status.canvasSize")}: {currentPage.canvasWidth}×{currentPage.canvasHeight}
          </span>
          <span className="mx-2">|</span>
          <span>
            {t("editor.status.objects")}: {objectCount}
          </span>
          {linkCount > 0 && (
            <>
              <span className="mx-2">|</span>
              <span>
                {t("links.linkCount", { count: linkCount })}
              </span>
            </>
          )}
          <span className="mx-2">|</span>
        </>
      )}
      <span className={saveStatusColor}>{saveStatusLabel}</span>
      <div className="flex-1" />
      {canvasMode === "sketch" && (
        <span className="text-accent mr-2">{t("canvas.modes.sketch")}</span>
      )}
      {currentProject && (
        <span className="text-text-muted">{currentProject.name}</span>
      )}
    </div>
  );
}
