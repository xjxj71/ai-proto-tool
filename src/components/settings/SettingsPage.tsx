import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import type { ModelConfig } from "@/types";
import { useModelStore } from "@/stores/modelStore";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import { ModelConfigList } from "./ModelConfigList";
import { DefaultModelSelector } from "./DefaultModelSelector";

export function SettingsPage() {
  const { t } = useTranslation();
  const setView = useUiStore((s) => s.setView);
  const currentProject = useProjectStore((s) => s.currentProject);
  const setConfigs = useModelStore((s) => s.setConfigs);
  const configs = useModelStore((s) => s.configs);

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const result = await invoke<ModelConfig[]>("list_model_configs");
        setConfigs(result);
      } catch (error) {
        console.error("Failed to load model configs:", error);
      }
    };
    loadConfigs();
  }, [setConfigs]);

  return (
    <div className="h-screen bg-bg-primary flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button
          onClick={() => setView(currentProject ? "editor" : "welcome")}
          className="text-text-tertiary hover:text-text-primary"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-sm font-medium text-text-primary">{t("settings.title")}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-6">
        <ModelConfigList />

        {configs.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <DefaultModelSelector type="text" />
            <DefaultModelSelector type="vision" />
          </div>
        )}
      </div>
    </div>
  );
}
