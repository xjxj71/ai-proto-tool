import { Line } from "fabric";
import type { Canvas, FabricObject } from "fabric";

const GRID_COLOR = "rgba(200, 200, 200, 0.3)";
const DEFAULT_GRID_SIZE = 20;

export function createGridOverlay(canvas: Canvas) {
  let lines: Line[] = [];
  let gridSize = DEFAULT_GRID_SIZE;
  let snapHandler: ((e: { target: FabricObject | undefined }) => void) | null = null;

  function showGrid(size: number = DEFAULT_GRID_SIZE): void {
    hideGrid();
    gridSize = size;
    const width = canvas.getWidth();
    const height = canvas.getHeight();

    for (let i = 0; i <= width; i += gridSize) {
      const line = new Line([i, 0, i, height], {
        stroke: GRID_COLOR,
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      canvas.add(line);
      canvas.sendObjectToBack(line);
      lines = [...lines, line];
    }

    for (let i = 0; i <= height; i += gridSize) {
      const line = new Line([0, i, width, i], {
        stroke: GRID_COLOR,
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      canvas.add(line);
      canvas.sendObjectToBack(line);
      lines = [...lines, line];
    }

    canvas.renderAll();
  }

  function hideGrid(): void {
    for (const line of lines) {
      canvas.remove(line);
    }
    lines = [];
    canvas.renderAll();
  }

  function snapToGrid(value: number, size: number = DEFAULT_GRID_SIZE): number {
    return Math.round(value / size) * size;
  }

  function enableSnapToGrid(size: number = DEFAULT_GRID_SIZE): void {
    snapHandler = (e) => {
      const obj = e.target;
      if (!obj) return;
      obj.set({
        left: snapToGrid(obj.left ?? 0, size),
        top: snapToGrid(obj.top ?? 0, size),
      });
    };
    canvas.on("object:moving", snapHandler);
  }

  function disableSnapToGrid(): void {
    if (snapHandler) {
      canvas.off("object:moving", snapHandler);
      snapHandler = null;
    }
  }

  return { showGrid, hideGrid, enableSnapToGrid, disableSnapToGrid };
}
