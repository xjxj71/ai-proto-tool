import { MenuBar } from "./MenuBar";
import { Toolbar } from "./Toolbar";
import { StatusBar } from "./StatusBar";
import { PagePanel } from "./PagePanel";
import { CanvasArea } from "./CanvasArea";
import { ChatPanel } from "./ChatPanel";
import { useUiStore } from "@/stores/uiStore";

export function EditorLayout() {
  const leftPanelVisible = useUiStore((s) => s.leftPanelVisible);
  const rightPanelVisible = useUiStore((s) => s.rightPanelVisible);

  return (
    <div className="h-screen flex flex-col bg-bg-primary text-text-primary">
      <MenuBar />
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        {leftPanelVisible && <PagePanel />}
        <CanvasArea />
        {rightPanelVisible && <ChatPanel />}
      </div>
      <StatusBar />
    </div>
  );
}
