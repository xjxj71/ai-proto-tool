import * as Dialog from "@radix-ui/react-dialog";
import { Download } from "lucide-react";
import { ExportOptions } from "./ExportOptions";
import { useExportStore } from "@/stores/exportStore";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: () => void;
}

export function ExportDialog({ open, onClose, onExport }: ExportDialogProps) {
  const isExporting = useExportStore((s) => s.isExporting);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-surface rounded-lg p-6 w-[420px] border border-border">
          <Dialog.Title className="text-lg font-medium text-text-primary mb-4">
            导出当前页面
          </Dialog.Title>
          <ExportOptions />
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              取消
            </button>
            <button
              onClick={onExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-accent text-white rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              {isExporting ? "导出中..." : "导出"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
