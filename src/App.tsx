import { useUiStore } from "@/stores/uiStore";
import { WelcomeScreen } from "@/components/welcome/WelcomeScreen";
import { EditorLayout } from "@/components/editor/EditorLayout";

function App() {
  const view = useUiStore((s) => s.view);

  if (view === "editor") {
    return <EditorLayout />;
  }

  return <WelcomeScreen />;
}

export default App;
