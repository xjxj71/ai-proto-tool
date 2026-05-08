import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText } from "lucide-react";
import type { Page } from "@/types";
import { PageContextMenu } from "./PageContextMenu";

interface PageItemProps {
  page: Page;
  isActive: boolean;
  onClick: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
}

export function PageItem({
  page,
  isActive,
  onClick,
  onRename,
  onDuplicate,
  onDelete,
  onExport,
}: PageItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(page.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== page.name) {
      onRename(page.id, trimmed);
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setRenameValue(page.name);
      setIsRenaming(false);
    }
  };

  const handleStartRename = () => {
    setRenameValue(page.name);
    setIsRenaming(true);
  };

  const content = (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
        isActive
          ? "bg-accent/20 text-accent border border-accent/30"
          : "text-text-secondary hover:bg-bg-tertiary border border-transparent"
      }`}
      onClick={() => {
        if (!isRenaming) onClick(page.id);
      }}
    >
      <div className="w-8 h-6 bg-bg-primary rounded flex-shrink-0 overflow-hidden flex items-center justify-center">
        {page.thumbnail ? (
          <img
            src={page.thumbnail}
            alt={page.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FileText size={12} className="text-text-muted" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            className="w-full bg-bg-primary border border-accent rounded px-1 py-0 text-xs text-text-primary outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-xs truncate block">{page.name}</span>
        )}
      </div>

      <span className="text-[10px] text-text-muted flex-shrink-0">
        {page.canvasWidth}×{page.canvasHeight}
      </span>
    </div>
  );

  return (
    <PageContextMenu
      onRename={handleStartRename}
      onDuplicate={() => onDuplicate(page.id)}
      onDelete={() => onDelete(page.id)}
      onExport={() => onExport(page.id)}
    >
      {content}
    </PageContextMenu>
  );
}
