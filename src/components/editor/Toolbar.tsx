import { useTranslation } from "react-i18next";
import { MousePointer, Pen, Square, Type, Undo2, Redo2 } from "lucide-react";
import { useUiStore, type ToolType } from "@/stores/uiStore";

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

  return (
    <div className="h-10 bg-bg-secondary border-b border-border flex items-center px-3 gap-1">
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
      <div className="w-px h-5 bg-border mx-2" />
      <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors" title={t("editor.toolbar.undo")}>
        <Undo2 size={16} />
      </button>
      <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors" title={t("editor.toolbar.redo")}>
        <Redo2 size={16} />
      </button>
    </div>
  );
}
