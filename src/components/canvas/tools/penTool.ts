import { v4 as uuidv4 } from "uuid";
import { PencilBrush } from "fabric";
import type { Canvas, Path } from "fabric";

export function createPenTool(canvas: Canvas) {
  function onPathCreated(opt: { path: Path }) {
    opt.path.set("elementId", uuidv4());
  }

  function activate() {
    canvas.isDrawingMode = true;
    canvas.selection = false;
    const brush = new PencilBrush(canvas);
    brush.width = 2;
    brush.color = "#333333";
    canvas.freeDrawingBrush = brush;
    canvas.on("path:created", onPathCreated);
  }

  function deactivate() {
    canvas.isDrawingMode = false;
    canvas.off("path:created", onPathCreated);
  }

  return { activate, deactivate };
}
