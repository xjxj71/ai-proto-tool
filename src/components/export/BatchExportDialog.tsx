import * as Dialog from "@radix-ui/react-dialog";
import { Download } from "lucide-react";
import { ExportOptions } from "./ExportOptions";
import { useExportStore } from "@/stores/exportStore";
import { useProjectStore } from "@/stores/projectStore";

interface BatchExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: () => void;
}

export function BatchExportDialog({ open, onClose, onExport }: BatchExportDialogProps) {
  const isExporting = useExportStore((s) => s.isExporting);
  const progress = useExportStore((s) => s.progress);
  const total = useExportStore((s) => s.total);
  const pages = useProjectStore((s) => s.pages);
  const currentProject = useProjectStore((s) => s.currentProject);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-surface rounded-lg p-6 w-[480px] border border-border">
          <Dialog.Title className="text-lg font-medium text-text-primary mb-2">
            批量导出项目
          </Dialog.Title>
          <p className="text-sm text-text-muted mb-4">
            将导出「{currentProject?.name ?? "未命名项目"}」的全部 {pages.length} 个页面
          </p>
          <ExportOptions />
          {isExporting && (
            <div className="mt-4">
              <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: total > 0 ? `${(progress / total) * 100}%` : "0%" }}
                />
              </div>
              <p className="text-xs text-text-muted mt-1">
                正在导出 {progress}/{total}...
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={onExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-accent text-white rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              {isExporting ? `导出中 ${progress}/${total}` : "导出全部"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
