import { useEffect, useRef } from "react";
import type { Canvas } from "fabric";
import { useUiStore } from "@/stores/uiStore";
import { createSelectTool } from "@/components/canvas/tools/selectTool";
import { createPenTool } from "@/components/canvas/tools/penTool";
import { createRectangleTool } from "@/components/canvas/tools/rectangleTool";
import { createTextTool } from "@/components/canvas/tools/textTool";

interface ToolInstance {
  activate: () => void;
  deactivate: () => void;
}

export function useToolManager(canvas: Canvas | null) {
  const activeTool = useUiStore((s) => s.activeTool);
  const currentToolRef = useRef<ToolInstance | null>(null);

  useEffect(() => {
    if (!canvas) return;
    currentToolRef.current?.deactivate();

    let tool: ToolInstance;
    switch (activeTool) {
      case "pen":
        tool = createPenTool(canvas);
        break;
      case "rectangle":
        tool = createRectangleTool(canvas);
        break;
      case "text":
        tool = createTextTool(canvas);
        break;
      default:
        tool = createSelectTool(canvas);
        break;
    }

    tool.activate();
    currentToolRef.current = tool;

    return () => {
      currentToolRef.current?.deactivate();
    };
  }, [canvas, activeTool]);

  return { activeTool };
}
