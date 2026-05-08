import { useTranslation } from "react-i18next";
import type { ModelConfig } from "@/types";
import { useModelStore } from "@/stores/modelStore";

interface DefaultModelSelectorProps {
  type: "text" | "vision";
}

export function DefaultModelSelector({ type }: DefaultModelSelectorProps) {
  const { t } = useTranslation();
  const configs = useModelStore((s) => s.configs);
  const setConfigs = useModelStore((s) => s.setConfigs);

  const filteredConfigs = configs.filter((c) =>
    type === "text"
      ? c.modelType === "text" || c.modelType === "both"
      : c.modelType === "vision" || c.modelType === "both"
  );

  const currentDefault = type === "text"
    ? configs.find((c) => c.isDefaultText)
    : configs.find((c) => c.isDefaultVision);

  const handleChange = async (configId: string) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const targetConfig = configs.find((c) => c.id === configId);
      if (!targetConfig) return;

      await invoke("update_model_config", {
        id: targetConfig.id,
        name: targetConfig.name,
        provider: targetConfig.provider,
        authMode: targetConfig.authMode,
        baseUrl: targetConfig.baseUrl,
        apiKey: targetConfig.apiKey,
        token: targetConfig.token,
        modelName: targetConfig.modelName,
        modelType: targetConfig.modelType,
        isDefaultText: type === "text" ? true : targetConfig.isDefaultText,
        isDefaultVision: type === "vision" ? true : targetConfig.isDefaultVision,
      });

      const updated = await invoke<ModelConfig[]>("list_model_configs");
      setConfigs(updated);
    } catch (error) {
      console.error("Failed to update default model:", error);
    }
  };

  const label = type === "text"
    ? t("settings.defaultTextModel")
    : t("settings.defaultVisionModel");

  return (
    <div>
      <label className="block text-xs text-text-secondary mb-1">{label}</label>
      <select
        value={currentDefault?.id ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full bg-bg-tertiary text-text-primary text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent"
      >
        <option value="">--</option>
        {filteredConfigs.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}
