import { useState } from "react";
import { ChevronDown, ChevronRight, Camera, Plus } from "lucide-react";
import { useSnapshotStore } from "@/stores/snapshotStore";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import { SnapshotItem } from "./SnapshotItem";

export function SnapshotList() {
  const [expanded, setExpanded] = useState(false);
  const snapshots = useSnapshotStore((s) => s.snapshots);
  const addSnapshot = useSnapshotStore((s) => s.addSnapshot);
  const removeSnapshot = useSnapshotStore((s) => s.removeSnapshot);

  const handleCreate = async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    const currentProject = useProjectStore.getState().currentProject;
    const currentPageId = useUiStore.getState().currentPageId;
    if (!currentProject || !currentPageId) return;

    try {
      const meta = await invoke<{ id: string; name: string; created_at: string }>("create_snapshot", {
        projectId: currentProject.id,
        pageId: currentPageId,
        name: `快照 ${new Date().toLocaleString("zh-CN")}`,
        canvasJson: JSON.stringify({}),
      });
      addSnapshot({
        id: meta.id,
        name: meta.name,
        createdAt: meta.created_at,
        canvasData: "{}",
      });
    } catch (err) {
      console.error("Failed to create snapshot:", err);
    }
  };

  const handleRestore = async (id: string) => {
    const { invoke } = await import("@tauri-apps/api/core");
    const currentProject = useProjectStore.getState().currentProject;
    const currentPageId = useUiStore.getState().currentPageId;
    if (!currentProject || !currentPageId) return;

    try {
      const canvasData = await invoke<string>("restore_snapshot", {
        projectId: currentProject.id,
        pageId: currentPageId,
        snapshotId: id,
      });
      window.dispatchEvent(
        new CustomEvent("snapshot:restore", { detail: { canvasData } }),
      );
    } catch (err) {
      console.error("Failed to restore snapshot:", err);
    }
  };

  const handleDelete = async (id: string) => {
    const { invoke } = await import("@tauri-apps/api/core");
    const currentProject = useProjectStore.getState().currentProject;
    if (!currentProject) return;

    try {
      await invoke("delete_snapshot", {
        projectId: currentProject.id,
        snapshotId: id,
      });
      removeSnapshot(id);
    } catch (err) {
      console.error("Failed to delete snapshot:", err);
    }
  };

  return (
    <div className="border-t border-border">
      <div className="flex items-center justify-between px-2 py-1.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <Camera size={10} />
          快照 ({snapshots.length})
        </button>
        {expanded && (
          <button
            onClick={handleCreate}
            className="p-0.5 text-text-muted hover:text-accent"
            title="创建快照"
          >
            <Plus size={10} />
          </button>
        )}
      </div>
      {expanded && (
        <div className="px-1 pb-1 max-h-[200px] overflow-y-auto">
          {snapshots.length === 0 ? (
            <p className="text-[10px] text-text-muted px-2 py-1">暂无快照</p>
          ) : (
            snapshots.map((snap) => (
              <SnapshotItem
                key={snap.id}
                snapshot={snap}
                onRestore={handleRestore}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
