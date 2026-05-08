import { useUiStore } from "@/stores/uiStore";
import { WelcomeScreen } from "@/components/welcome/WelcomeScreen";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

function AppContent() {
  const view = useUiStore((s) => s.view);

  if (view === "editor") {
    return <EditorLayout />;
  }

  if (view === "settings") {
    return <SettingsPage />;
  }

  return <WelcomeScreen />;
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
