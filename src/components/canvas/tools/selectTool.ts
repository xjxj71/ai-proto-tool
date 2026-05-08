import type { Canvas } from "fabric";

export function createSelectTool(canvas: Canvas) {
  function activate() {
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = "default";
    canvas.hoverCursor = "move";
    canvas.discardActiveObject();
    canvas.renderAll();
  }

  function deactivate() {
    // No persistent state to clean up
  }

  return { activate, deactivate };
}
