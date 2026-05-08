import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { PageItem } from "./PageItem";
import { CANVAS_PRESETS, type Page } from "@/types";

export function PagePanel() {
  const { t } = useTranslation();
  const pages = useProjectStore((s) => s.pages);
  const currentProject = useProjectStore((s) => s.currentProject);
  const setPages = useProjectStore((s) => s.setPages);
  const currentPageId = useUiStore((s) => s.currentPageId);
  const setCurrentPageId = useUiStore((s) => s.setCurrentPageId);
  const clearHistory = useCanvasStore((s) => s.clearHistory);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handlePageClick = useCallback(async (pageId: string) => {
    if (pageId === currentPageId) return;
    setCurrentPageId(pageId);
    clearHistory();
  }, [currentPageId, setCurrentPageId, clearHistory]);

  const handleNewPage = useCallback(async () => {
    if (!currentProject) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const preset = CANVAS_PRESETS.find(
        (p) => p.name === currentProject.canvasPreset
      ) ?? CANVAS_PRESETS[0];
      if (!preset) return;
      await invoke("create_page", {
        input: {
          project_id: currentProject.id,
          name: `${t("page.untitled")} ${pages.length + 1}`,
          canvas_width: preset.width,
          canvas_height: preset.height,
        },
      });
      const updatedPages = await invoke("list_pages", {
        projectId: currentProject.id,
      }) as Page[];
      setPages(updatedPages);
      if (updatedPages.length > 0) {
        const newest = updatedPages[updatedPages.length - 1];
        if (newest) {
          setCurrentPageId(newest.id);
          clearHistory();
        }
      }
    } catch (error) {
      console.error("Failed to create page:", error);
    }
  }, [currentProject, pages.length, setPages, setCurrentPageId, clearHistory, t]);

  const handleRename = useCallback(async (pageId: string, name: string) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("rename_page", { id: pageId, name });
      const updatedPages = pages.map((p) =>
        p.id === pageId ? { ...p, name } : p
      );
      setPages(updatedPages);
    } catch (error) {
      console.error("Failed to rename page:", error);
    }
  }, [pages, setPages]);

  const handleDuplicate = useCallback(async (pageId: string) => {
    if (!currentProject) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("duplicate_page", {
        projectId: currentProject.id,
        pageId,
      });
      const updatedPages = await invoke("list_pages", {
        projectId: currentProject.id,
      }) as Page[];
      setPages(updatedPages);
    } catch (error) {
      console.error("Failed to duplicate page:", error);
    }
  }, [currentProject, setPages]);

  const handleDelete = useCallback(async (pageId: string) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("delete_page", { id: pageId });
      const remaining = pages.filter((p) => p.id !== pageId);
      setPages(remaining);
      if (currentPageId === pageId) {
        const firstRemaining = remaining[0];
        if (firstRemaining) {
          setCurrentPageId(firstRemaining.id);
        } else {
          setCurrentPageId("");
        }
        clearHistory();
      }
    } catch (error) {
      console.error("Failed to delete page:", error);
    }
  }, [pages, currentPageId, setPages, setCurrentPageId, clearHistory]);

  const handleExport = useCallback((_pageId: string) => {
    console.log("Export page:", _pageId);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    if (!currentProject) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const prevPages = [...pages];
    const reordered = [...pages];
    const extracted = reordered.splice(oldIndex, 1);
    const moved = extracted[0];
    if (!moved) return;
    reordered.splice(newIndex, 0, moved);
    setPages(reordered);

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("reorder_pages", {
        projectId: currentProject.id,
        pageIds: reordered.map((p) => p.id),
      });
    } catch (error) {
      console.error("Failed to reorder pages:", error);
      setPages(prevPages);
    }
  }, [pages, currentProject, setPages]);

  return (
    <div className="w-[200px] bg-bg-secondary border-r border-border flex flex-col">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{t("page.title")}</span>
        <button
          onClick={handleNewPage}
          className="p-1 text-text-muted hover:text-accent transition-colors"
          title={t("page.newPage")}
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {pages.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-4">{t("page.emptyList")}</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pages.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {pages.map((page) => (
                <PageItem
                  key={page.id}
                  page={page}
                  isActive={page.id === currentPageId}
                  onClick={handlePageClick}
                  onRename={handleRename}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onExport={handleExport}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {pages.length > 0 && (
        <div className="p-2 border-t border-border">
          <span className="text-[10px] text-text-muted">
            {t("page.pageCount", { count: pages.length })}
          </span>
        </div>
      )}
    </div>
  );
}
