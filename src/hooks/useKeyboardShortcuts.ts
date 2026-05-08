import { useEffect, useCallback } from "react";
import { useUiStore, type ToolType } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { useProjectStore } from "@/stores/projectStore";
import { getCanvasJSON, loadCanvasJSON } from "@/utils/canvasSerializer";
import type { Canvas } from "fabric";

interface UseKeyboardShortcutsOptions {
  getCanvas: () => Canvas | null;
}

export function useKeyboardShortcuts({ getCanvas }: UseKeyboardShortcutsOptions) {
  const setActiveTool = useUiStore((s) => s.setActiveTool);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return;
    }

    const isCtrl = e.ctrlKey || e.metaKey;

    if (!isCtrl && !e.altKey) {
      const toolMap: Record<string, ToolType> = {
        v: "select",
        b: "pen",
        r: "rectangle",
        t: "text",
      };
      const tool = toolMap[e.key.toLowerCase()];
      if (tool) {
        e.preventDefault();
        setActiveTool(tool);
        return;
      }
    }

    if (isCtrl && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      const store = useCanvasStore.getState();
      if (store.historyIndex > 0) {
        const snapshot = store.goBack();
        if (snapshot) {
          const canvas = getCanvas();
          if (canvas) {
            loadCanvasJSON(canvas, snapshot);
          }
        }
      }
      return;
    }

    if (isCtrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
      e.preventDefault();
      const store = useCanvasStore.getState();
      if (store.historyIndex < store.history.length - 1) {
        const snapshot = store.goForward();
        if (snapshot) {
          const canvas = getCanvas();
          if (canvas) {
            loadCanvasJSON(canvas, snapshot);
          }
        }
      }
      return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      const canvas = getCanvas();
      if (!canvas) return;
      const active = canvas.getActiveObjects();
      if (active.length > 0) {
        e.preventDefault();
        for (const obj of active) {
          canvas.remove(obj);
        }
        canvas.discardActiveObject();
        canvas.renderAll();
      }
      return;
    }

    if (isCtrl && e.key === "d") {
      e.preventDefault();
      const canvas = getCanvas();
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (active) {
        active.clone().then((cloned) => {
          if (!cloned) return;
          cloned.set({
            left: (cloned.left ?? 0) + 20,
            top: (cloned.top ?? 0) + 20,
          });
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          canvas.renderAll();
        });
      }
      return;
    }

    // Plan 4 additions: Ctrl+S (save), Ctrl+E (export), Ctrl+1/3 (panel toggle)
    if (isCtrl && e.key === "s") {
      e.preventDefault();
      const canvas = getCanvas();
      const projectId = useProjectStore.getState().currentProject?.id;
      const pageId = useUiStore.getState().currentPageId;
      if (canvas && projectId && pageId) {
        const json = JSON.stringify(getCanvasJSON(canvas));
        const store = useCanvasStore.getState();
        store.setSaveStatus("saving");
        import("@tauri-apps/api/core").then(({ invoke }) => {
          invoke("save_canvas_json", { projectId, pageId, json })
            .then(() => store.setSaveStatus("saved"))
            .catch(() => store.setSaveStatus("unsaved"));
        });
      }
      return;
    }

    if (isCtrl && e.key === "e") {
      e.preventDefault();
      useUiStore.getState().setView("editor");
      return;
    }

    if (isCtrl && e.key === "1") {
      e.preventDefault();
      useUiStore.getState().toggleLeftPanel();
      return;
    }

    if (isCtrl && e.key === "3") {
      e.preventDefault();
      useUiStore.getState().toggleRightPanel();
      return;
    }
  }, [setActiveTool, getCanvas]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
