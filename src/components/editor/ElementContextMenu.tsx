interface ElementContextMenuProps {
  x: number;
  y: number;
  elementId: string;
  hasLink: boolean;
  onSetLink: () => void;
  onEditLink: () => void;
  onRemoveLink: () => void;
  onClose: () => void;
}

export function ElementContextMenu({ x, y, hasLink, onSetLink, onEditLink, onRemoveLink, onClose }: ElementContextMenuProps) {
  return (
    <div
      style={{ position: "fixed", left: x, top: y, zIndex: 1000 }}
      className="min-w-[160px] bg-bg-surface border border-border rounded-lg p-1 shadow-xl"
    >
      <button
        onClick={() => { hasLink ? onEditLink() : onSetLink(); onClose(); }}
        className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded cursor-pointer"
      >
        {hasLink ? "编辑链接" : "设置链接"}
      </button>
      {hasLink && (
        <>
          <div className="h-px bg-border my-1" />
          <button
            onClick={() => { onRemoveLink(); onClose(); }}
            className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-danger hover:bg-bg-tertiary rounded cursor-pointer"
          >
            移除链接
          </button>
        </>
      )}
    </div>
  );
}
