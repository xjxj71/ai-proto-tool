import { useRef, useCallback, useEffect, useState } from "react";
import { CanvasRenderer, type CanvasRendererHandle } from "@/components/canvas/CanvasRenderer";
import { ViewportControls } from "@/components/canvas/ViewportControls";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import { useToolManager } from "@/hooks/useToolManager";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAutoSave } from "@/hooks/useAutoSave";
import { applyCanvasMode } from "@/components/canvas/modes/canvasModes";
import { createGridOverlay } from "@/components/canvas/GridOverlay";
import { getCanvasJSON } from "@/utils/canvasSerializer";
import { ElementContextMenu } from "./ElementContextMenu";
import { PageSelectorDialog } from "./PageSelectorDialog";
import { useLinkStore } from "@/stores/linkStore";
import { getLinksForElement } from "@/canvas/linkManager";
import type { Canvas } from "fabric";
import type { Page } from "@/types";

function CanvasAreaInner({ currentPageId, currentPage }: { currentPageId: string; currentPage: Page }) {
  const rendererRef = useRef<CanvasRendererHandle>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const gridOverlayRef = useRef<ReturnType<typeof createGridOverlay> | null>(null);
  const currentProject = useProjectStore((s) => s.currentProject);
  const canvasMode = useUiStore((s) => s.canvasMode);
  const gridVisible = useUiStore((s) => s.gridVisible);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string } | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorElementId, setSelectorElementId] = useState<string | null>(null);
  const links = useLinkStore((s) => s.links);
  const addLink = useLinkStore((s) => s.addLink);
  const removeLink = useLinkStore((s) => s.removeLink);
  const pages = useProjectStore((s) => s.pages);

  const { triggerSave } = useAutoSave({
    projectId: currentProject?.id ?? "",
    pageId: currentPageId,
    enabled: !!currentProject,
    debounceMs: 2000,
  });

  const handleCanvasReady = useCallback((canvas: Canvas) => {
    canvasRef.current = canvas;
    gridOverlayRef.current = createGridOverlay(canvas);

    (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const json = await invoke("load_canvas_json", {
          projectId: currentProject?.id ?? "",
          pageId: currentPageId,
        });
        if (json) {
          const parsed = typeof json === "string" ? JSON.parse(json) : json;
          try {
            await canvas.loadFromJSON(parsed);
          } catch (loadError) {
            canvas.clear();
            canvas.renderAll();
            console.error("Failed to load canvas data:", loadError);
          }
        }
      } catch (error) {
        console.error("Failed to load canvas data:", error);
      }
    })();

    canvas.on("object:added", () => {
      const data = getCanvasJSON(canvas);
      triggerSave(JSON.stringify(data));
    });
    canvas.on("object:modified", () => {
      const data = getCanvasJSON(canvas);
      triggerSave(JSON.stringify(data));
    });
    canvas.on("object:removed", () => {
      const data = getCanvasJSON(canvas);
      triggerSave(JSON.stringify(data));
    });
  }, [currentPageId, currentProject?.id, triggerSave]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    applyCanvasMode(canvas, canvasMode);
  }, [canvasMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (opt: { e: MouseEvent | TouchEvent }) => {
      if (!("button" in opt.e)) return;
      const mouseEvent = opt.e as MouseEvent;
      if (mouseEvent.button === 2) {
        const target = canvas.findTarget(mouseEvent);
        if (target && "elementId" in target) {
          mouseEvent.preventDefault();
          setContextMenu({
            x: mouseEvent.clientX,
            y: mouseEvent.clientY,
            elementId: (target as unknown as { elementId: string }).elementId,
          });
        }
      }
      if (mouseEvent.button === 0) {
        setContextMenu(null);
      }
    };

    canvas.on("mouse:down", handleMouseDown);
    return () => {
      canvas.off("mouse:down", handleMouseDown);
    };
  }, []);

  useEffect(() => {
    const grid = gridOverlayRef.current;
    if (!grid) return;
    if (canvasMode === "design" && gridVisible) {
      grid.showGrid(20);
      grid.enableSnapToGrid(20);
    } else {
      grid.hideGrid();
      grid.disableSnapToGrid();
    }
  }, [canvasMode, gridVisible]);

  useToolManager(canvasRef.current);
  useKeyboardShortcuts({ getCanvas: () => canvasRef.current });

  return (
    <div className="flex-1 bg-bg-primary flex items-center justify-center relative overflow-hidden">
      <div className="relative" style={{ maxWidth: "100%", maxHeight: "100%" }}>
        <CanvasRenderer
          ref={rendererRef}
          width={currentPage.canvasWidth}
          height={currentPage.canvasHeight}
          onCanvasReady={handleCanvasReady}
        />
      </div>
      <ViewportControls getCanvas={() => rendererRef.current?.getCanvas() ?? null} />
      {contextMenu && (
        <ElementContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          elementId={contextMenu.elementId}
          hasLink={!!getLinksForElement(links, contextMenu.elementId)}
          onSetLink={() => { setSelectorElementId(contextMenu.elementId); setSelectorOpen(true); }}
          onEditLink={() => { setSelectorElementId(contextMenu.elementId); setSelectorOpen(true); }}
          onRemoveLink={() => { removeLink(contextMenu.elementId); setContextMenu(null); }}
          onClose={() => setContextMenu(null)}
        />
      )}
      <PageSelectorDialog
        open={selectorOpen}
        pages={pages}
        currentPageId={currentPageId}
        onSelect={(targetPageId) => {
          if (selectorElementId) {
            const targetPage = pages.find((p) => p.id === targetPageId);
            addLink(selectorElementId, targetPageId, targetPage?.name ?? "未知页面");
          }
          setSelectorOpen(false);
          setSelectorElementId(null);
          setContextMenu(null);
        }}
        onClose={() => { setSelectorOpen(false); setSelectorElementId(null); }}
      />
    </div>
  );
}

export function CanvasArea() {
  const currentPageId = useUiStore((s) => s.currentPageId);
  const pages = useProjectStore((s) => s.pages);
  const currentPage = pages.find((p) => p.id === currentPageId);

  if (!currentPageId || !currentPage) {
    return (
      <div className="flex-1 bg-bg-primary flex items-center justify-center">
        <div className="text-text-muted text-sm">
          请从左侧面板选择或创建页面
        </div>
      </div>
    );
  }

  return <CanvasAreaInner currentPageId={currentPageId} currentPage={currentPage} />;
}
