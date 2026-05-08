import { v4 as uuidv4 } from "uuid";
import { IText } from "fabric";
import type { Canvas, TPointerEvent, TPointerEventInfo } from "fabric";

type PointerHandler = (opt: TPointerEventInfo<TPointerEvent>) => void;

export function createTextTool(canvas: Canvas) {
  const onMouseDown: PointerHandler = (opt) => {
    const pointer = canvas.getScenePoint(opt.e);
    const text = new IText("文本", {
      left: pointer.x,
      top: pointer.y,
      fontSize: 16,
      fill: "#333333",
      fontFamily: "sans-serif",
      selectable: true,
      editable: true,
    });
    text.set("elementId", uuidv4());
    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    canvas.renderAll();
  };

  function activate() {
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = "text";
    canvas.discardActiveObject();
    canvas.renderAll();
    canvas.on("mouse:down", onMouseDown);
  }

  function deactivate() {
    canvas.off("mouse:down", onMouseDown);
    canvas.defaultCursor = "default";
  }

  return { activate, deactivate };
}
