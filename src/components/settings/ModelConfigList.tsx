import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import type { ModelConfig } from "@/types";
import { useModelStore } from "@/stores/modelStore";
import { ModelConfigCard } from "./ModelConfigCard";
import { ModelConfigDialog } from "./ModelConfigDialog";

export function ModelConfigList() {
  const { t } = useTranslation();
  const configs = useModelStore((s) => s.configs);
  const setConfigs = useModelStore((s) => s.setConfigs);
  const [dialogConfig, setDialogConfig] = useState<ModelConfig | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleAdd = () => {
    setDialogConfig(null);
    setShowDialog(true);
  };

  const handleEdit = (config: ModelConfig) => {
    setDialogConfig(config);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("delete_model_config", { id });
      const updated = await invoke<ModelConfig[]>("list_model_configs");
      setConfigs(updated);
    } catch (error) {
      console.error("Failed to delete model config:", error);
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("ai_test_connection", { modelConfigId: id });
      const updated = await invoke<ModelConfig[]>("list_model_configs");
      setConfigs(updated);
    } catch (error) {
      console.error("Connection test failed:", error);
    }
  };

  const handleSave = async (data: Omit<ModelConfig, "id" | "connectionStatus" | "lastTestedAt" | "createdAt" | "updatedAt">) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");

      if (dialogConfig) {
        await invoke("update_model_config", {
          id: dialogConfig.id,
          name: data.name,
          provider: data.provider,
          authMode: data.authMode,
          baseUrl: data.baseUrl,
          apiKey: data.apiKey,
          token: data.token,
          modelName: data.modelName,
          modelType: data.modelType,
          isDefaultText: data.isDefaultText,
          isDefaultVision: data.isDefaultVision,
        });
      } else {
        await invoke("create_model_config", {
          name: data.name,
          provider: data.provider,
          authMode: data.authMode,
          baseUrl: data.baseUrl,
          apiKey: data.apiKey,
          token: data.token,
          modelName: data.modelName,
          modelType: data.modelType,
          isDefaultText: data.isDefaultText,
          isDefaultVision: data.isDefaultVision,
        });
      }

      const updated = await invoke<ModelConfig[]>("list_model_configs");
      setConfigs(updated);
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to save model config:", error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text-primary">{t("settings.modelConfig")}</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent/90"
        >
          <Plus size={12} />
          {t("settings.addModel")}
        </button>
      </div>

      {configs.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-text-tertiary">{t("settings.noModels")}</p>
          <p className="text-xs text-text-tertiary mt-1">{t("settings.noModelsHint")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {configs.map((config) => (
            <ModelConfigCard
              key={config.id}
              config={config}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTestConnection={handleTestConnection}
            />
          ))}
        </div>
      )}

      {showDialog && (
        <ModelConfigDialog
          config={dialogConfig}
          onSave={handleSave}
          onClose={() => setShowDialog(false)}
        />
      )}
    </div>
  );
}
