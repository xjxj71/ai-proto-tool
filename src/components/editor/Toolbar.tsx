import { useTranslation } from "react-i18next";
import {
  MousePointer, Pen, Square, Type, Undo2, Redo2,
  Paintbrush, Grid3x3,
} from "lucide-react";
import { useUiStore, type ToolType } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";
import type { CanvasMode } from "@/types";

const TOOLS: { type: ToolType; icon: typeof MousePointer; labelKey: string }[] = [
  { type: "select", icon: MousePointer, labelKey: "editor.toolbar.select" },
  { type: "pen", icon: Pen, labelKey: "editor.toolbar.pen" },
  { type: "rectangle", icon: Square, labelKey: "editor.toolbar.rectangle" },
  { type: "text", icon: Type, labelKey: "editor.toolbar.text" },
];

export function Toolbar() {
  const { t } = useTranslation();
  const activeTool = useUiStore((s) => s.activeTool);
  const setActiveTool = useUiStore((s) => s.setActiveTool);
  const canvasMode = useUiStore((s) => s.canvasMode);
  const setCanvasMode = useUiStore((s) => s.setCanvasMode);
  const gridVisible = useUiStore((s) => s.gridVisible);
  const toggleGrid = useUiStore((s) => s.toggleGrid);
  const canUndo = useCanvasStore((s) => s.historyIndex >= 0);
  const canRedo = useCanvasStore((s) => s.historyIndex < s.history.length - 1);

  const handleModeToggle = () => {
    const next: CanvasMode = canvasMode === "sketch" ? "design" : "sketch";
    setCanvasMode(next);
  };

  const modeLabel = canvasMode === "sketch"
    ? t("editor.toolbar.designMode")
    : t("editor.toolbar.sketchMode");

  return (
    <div className="h-10 bg-bg-secondary border-b border-border flex items-center px-3 gap-1">
      <button
        onClick={handleModeToggle}
        className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
        title={modeLabel}
      >
        <Paintbrush size={14} />
        {modeLabel}
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {TOOLS.map(({ type, icon: Icon, labelKey }) => (
        <button
          key={type}
          onClick={() => setActiveTool(type)}
          className={`p-1.5 rounded transition-colors ${
            activeTool === type
              ? "bg-accent text-white"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
          }`}
          title={t(labelKey)}
        >
          <Icon size={16} />
        </button>
      ))}

      <div className="w-px h-5 bg-border mx-1" />

      <button
        onClick={toggleGrid}
        className={`p-1.5 rounded transition-colors ${
          gridVisible
            ? "bg-accent/20 text-accent"
            : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
        }`}
        title={t("editor.toolbar.toggleGrid")}
      >
        <Grid3x3 size={16} />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      <button
        className={`p-1.5 rounded transition-colors ${
          canUndo
            ? "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
            : "text-text-muted cursor-not-allowed"
        }`}
        title={t("editor.toolbar.undo")}
        disabled={!canUndo}
      >
        <Undo2 size={16} />
      </button>
      <button
        className={`p-1.5 rounded transition-colors ${
          canRedo
            ? "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
            : "text-text-muted cursor-not-allowed"
        }`}
        title={t("editor.toolbar.redo")}
        disabled={!canRedo}
      >
        <Redo2 size={16} />
      </button>
    </div>
  );
}
