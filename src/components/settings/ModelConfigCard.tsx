import { useTranslation } from "react-i18next";
import { Wifi, WifiOff, Edit, Trash2 } from "lucide-react";
import type { ModelConfig } from "@/types";
import { getPresetById } from "./ProviderPresets";

interface ModelConfigCardProps {
  config: ModelConfig;
  onEdit: (config: ModelConfig) => void;
  onDelete: (id: string) => void;
  onTestConnection: (id: string) => void;
}

export function ModelConfigCard({ config, onEdit, onDelete, onTestConnection }: ModelConfigCardProps) {
  const { t } = useTranslation();
  const preset = getPresetById(config.provider);

  return (
    <div className="border border-border rounded-lg p-3 hover:border-accent/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary truncate">{config.name}</span>
            {config.isDefaultText && (
              <span className="text-[10px] bg-accent/10 text-accent px-1 rounded">
                {t("settings.defaultTextModel")}
              </span>
            )}
            {config.isDefaultVision && (
              <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">
                {t("settings.defaultVisionModel")}
              </span>
            )}
          </div>
          <div className="text-xs text-text-tertiary mt-0.5">
            {preset?.name ?? config.provider} / {config.modelName}
          </div>
          <div className="text-xs text-text-tertiary font-mono truncate mt-0.5">
            {config.baseUrl}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onTestConnection(config.id)}
            className="p-1 text-text-tertiary hover:text-text-primary"
            title={t("settings.testConnection")}
          >
            {config.connectionStatus === "ok" ? (
              <Wifi size={14} className="text-green-500" />
            ) : (
              <WifiOff size={14} />
            )}
          </button>
          <button
            onClick={() => onEdit(config)}
            className="p-1 text-text-tertiary hover:text-text-primary"
            title={t("settings.editModel")}
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onDelete(config.id)}
            className="p-1 text-text-tertiary hover:text-red-500"
            title={t("settings.deleteModel")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
