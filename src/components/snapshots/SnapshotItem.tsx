import { useState } from "react";
import { Clock, RotateCcw, Trash2 } from "lucide-react";
import type { Snapshot } from "@/stores/snapshotStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface SnapshotItemProps {
  snapshot: Snapshot;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SnapshotItem({ snapshot, onRestore, onDelete }: SnapshotItemProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  return (
    <div className="group flex items-center justify-between px-2 py-1.5 hover:bg-bg-tertiary rounded text-xs">
      <div className="flex items-center gap-1.5 text-text-secondary min-w-0">
        <Clock size={10} className="shrink-0" />
        <span className="truncate">{snapshot.name}</span>
        <span className="text-text-muted shrink-0">
          {new Date(snapshot.createdAt).toLocaleString("zh-CN", {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onRestore(snapshot.id)}
          className="p-0.5 text-text-muted hover:text-accent"
          title="恢复此快照"
        >
          <RotateCcw size={10} />
        </button>
        <button
          onClick={() => setDeleteConfirmOpen(true)}
          className="p-0.5 text-text-muted hover:text-danger"
          title="删除快照"
        >
          <Trash2 size={10} />
        </button>
      </div>
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="删除快照"
        message={`确定要删除快照"${snapshot.name}"吗？此操作不可撤销。`}
        confirmLabel="删除"
        variant="danger"
        onConfirm={() => { onDelete(snapshot.id); setDeleteConfirmOpen(false); }}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
