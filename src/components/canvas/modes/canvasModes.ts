import { PencilBrush } from "fabric";
import type { Canvas } from "fabric";
import type { CanvasMode } from "@/types";

interface ModeConfig {
  apply: (canvas: Canvas) => void;
}

const SKETCH_BRUSH_WIDTH = 3;
const SKETCH_BRUSH_COLOR = "#555555";
const DESIGN_GRID_SIZE = 20;

const modeConfigs: Record<CanvasMode, ModeConfig> = {
  sketch: {
    apply(canvas: Canvas) {
      canvas.isDrawingMode = true;
      const brush = new PencilBrush(canvas);
      brush.width = SKETCH_BRUSH_WIDTH;
      brush.color = SKETCH_BRUSH_COLOR;
      brush.strokeDashArray = null;
      canvas.freeDrawingBrush = brush;
    },
  },
  design: {
    apply(canvas: Canvas) {
      canvas.isDrawingMode = false;
      canvas.selection = true;
    },
  },
};

export function applyCanvasMode(canvas: Canvas, mode: CanvasMode): void {
  modeConfigs[mode].apply(canvas);
}

export function getSketchBrushConfig(): { width: number; color: string } {
  return { width: SKETCH_BRUSH_WIDTH, color: SKETCH_BRUSH_COLOR };
}

export function getDesignGridSize(): number {
  return DESIGN_GRID_SIZE;
}
