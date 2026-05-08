import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import type { Page } from "@/types";

interface PageSelectorDialogProps {
  open: boolean;
  pages: Page[];
  currentPageId: string;
  onSelect: (pageId: string) => void;
  onClose: () => void;
}

export function PageSelectorDialog({
  open,
  pages,
  currentPageId,
  onSelect,
  onClose,
}: PageSelectorDialogProps) {
  const { t } = useTranslation();
  const otherPages = pages.filter((p) => p.id !== currentPageId);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-surface rounded-lg p-4 w-[360px] border border-border max-h-[400px] overflow-y-auto">
          <Dialog.Title className="text-sm font-medium text-text-primary mb-3">
            {t("export.selectTarget", "选择目标页面")}
          </Dialog.Title>
          {otherPages.length === 0 ? (
            <p className="text-xs text-text-muted py-4 text-center">
              {t("export.noPages", "没有其他页面可链接")}
            </p>
          ) : (
            <ul className="space-y-1">
              {otherPages.map((page) => (
                <li key={page.id}>
                  <button
                    onClick={() => { onSelect(page.id); onClose(); }}
                    className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
                  >
                    {page.name}
                    <span className="text-xs text-text-muted ml-2">
                      {page.canvasWidth}×{page.canvasHeight}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
