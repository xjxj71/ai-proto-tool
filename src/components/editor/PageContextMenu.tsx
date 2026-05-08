import { useTranslation } from "react-i18next";
import * as ContextMenu from "@radix-ui/react-context-menu";

interface PageContextMenuProps {
  children: React.ReactNode;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onExport: () => void;
}

export function PageContextMenu({
  children,
  onRename,
  onDuplicate,
  onDelete,
  onExport,
}: PageContextMenuProps) {
  const { t } = useTranslation();

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          className="min-w-[160px] bg-bg-surface border border-border rounded-md p-1 shadow-lg z-50"
        >
          <ContextMenu.Item
            className="px-3 py-1.5 text-sm text-text-primary hover:bg-accent hover:text-white rounded cursor-pointer outline-none"
            onSelect={onRename}
          >
            {t("page.rename")}
          </ContextMenu.Item>
          <ContextMenu.Item
            className="px-3 py-1.5 text-sm text-text-primary hover:bg-accent hover:text-white rounded cursor-pointer outline-none"
            onSelect={onDuplicate}
          >
            {t("page.duplicate")}
          </ContextMenu.Item>
          <ContextMenu.Item
            className="px-3 py-1.5 text-sm text-text-primary hover:bg-accent hover:text-white rounded cursor-pointer outline-none"
            onSelect={onExport}
          >
            {t("page.export")}
          </ContextMenu.Item>
          <ContextMenu.Separator className="h-px bg-border my-1" />
          <ContextMenu.Item
            className="px-3 py-1.5 text-sm text-danger hover:bg-danger hover:text-white rounded cursor-pointer outline-none"
            onSelect={onDelete}
          >
            {t("page.delete")}
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
