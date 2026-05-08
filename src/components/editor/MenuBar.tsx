import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ExportDialog } from "@/components/export/ExportDialog";
import { BatchExportDialog } from "@/components/export/BatchExportDialog";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";

export function MenuBar() {
  const { t } = useTranslation();
  const currentProject = useProjectStore((s) => s.currentProject);
  const setView = useUiStore((s) => s.setView);
  const clearCurrentProject = useProjectStore((s) => s.clearCurrentProject);

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

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
      {(["file", "edit", "view"] as const).map((menu) => (
        <button
          key={menu}
          className="px-2 py-0.5 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
        >
          {t(`editor.menu.${menu}`)}
        </button>
      ))}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="px-2 py-0.5 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors">
            {t("editor.menu.export")}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="min-w-[140px] bg-bg-surface border border-border rounded-lg p-1 z-50">
            <DropdownMenu.Item
              onSelect={() => setExportDialogOpen(true)}
              className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded cursor-pointer outline-none"
            >
              {t("export.singlePage")}
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => setBatchDialogOpen(true)}
              className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded cursor-pointer outline-none"
            >
              {t("export.batchExport")}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <div className="flex-1" />
      <button
        onClick={() => setView("settings")}
        className="px-2 py-0.5 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors flex items-center gap-1"
        title={t("editor.menu.settings")}
      >
        <Settings size={12} />
        {t("editor.menu.settings")}
      </button>
      <ThemeToggle />
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={() => setExportDialogOpen(false)}
      />
      <BatchExportDialog
        open={batchDialogOpen}
        onClose={() => setBatchDialogOpen(false)}
        onExport={() => setBatchDialogOpen(false)}
      />
    </div>
  );
}
