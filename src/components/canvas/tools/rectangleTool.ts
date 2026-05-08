import { v4 as uuidv4 } from "uuid";
import { Rect } from "fabric";
import type { Canvas, TPointerEvent, TPointerEventInfo } from "fabric";

type PointerHandler = (opt: TPointerEventInfo<TPointerEvent>) => void;

export function createRectangleTool(canvas: Canvas) {
  let isDrawing = false;
  let startX = 0;
  let startY = 0;
  let currentRect: Rect | null = null;

  const onMouseDown: PointerHandler = (opt) => {
    const pointer = canvas.getScenePoint(opt.e);
    isDrawing = true;
    startX = pointer.x;
    startY = pointer.y;

    currentRect = new Rect({
      left: startX,
      top: startY,
      width: 0,
      height: 0,
      fill: "transparent",
      stroke: "#333333",
      strokeWidth: 2,
      selectable: true,
    });
    currentRect.set("elementId", uuidv4());

    canvas.add(currentRect);
  };

  const onMouseMove: PointerHandler = (opt) => {
    if (!isDrawing || !currentRect) return;
    const pointer = canvas.getScenePoint(opt.e);
    const left = Math.min(startX, pointer.x);
    const top = Math.min(startY, pointer.y);
    const width = Math.abs(pointer.x - startX);
    const height = Math.abs(pointer.y - startY);
    currentRect.set({ left, top, width, height });
    canvas.renderAll();
  };

  const onMouseUp: PointerHandler = () => {
    isDrawing = false;
    currentRect = null;
  };

  function activate() {
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = "crosshair";
    canvas.discardActiveObject();
    canvas.renderAll();
    canvas.on("mouse:down", onMouseDown);
    canvas.on("mouse:move", onMouseMove);
    canvas.on("mouse:up", onMouseUp);
  }

  function deactivate() {
    canvas.off("mouse:down", onMouseDown);
    canvas.off("mouse:move", onMouseMove);
    canvas.off("mouse:up", onMouseUp);
    canvas.defaultCursor = "default";
    if (currentRect) {
      canvas.remove(currentRect);
      currentRect = null;
    }
    isDrawing = false;
  }

  return { activate, deactivate };
}
