import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import type { ModelConfig, AuthMode, ModelType, ProviderType } from "@/types";
import { PROVIDER_PRESETS, getPresetById, getAuthModeLabel } from "./ProviderPresets";

interface ModelConfigDialogProps {
  config?: ModelConfig | null;
  onSave: (data: Omit<ModelConfig, "id" | "connectionStatus" | "lastTestedAt" | "createdAt" | "updatedAt">) => void;
  onClose: () => void;
}

export function ModelConfigDialog({ config, onSave, onClose }: ModelConfigDialogProps) {
  const { t } = useTranslation();

  const [name, setName] = useState(config?.name ?? "");
  const [provider, setProvider] = useState<ProviderType>(config?.provider as ProviderType ?? "openai");
  const [authMode, setAuthMode] = useState<AuthMode>(config?.authMode as AuthMode ?? "standard_api");
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl ?? "");
  const [apiKey, setApiKey] = useState(config?.apiKey ?? "");
  const [token, setToken] = useState(config?.token ?? "");
  const [modelName, setModelName] = useState(config?.modelName ?? "");
  const [modelType, setModelType] = useState<ModelType>(config?.modelType as ModelType ?? "text");
  const [isDefaultText, setIsDefaultText] = useState(config?.isDefaultText ?? false);
  const [isDefaultVision, setIsDefaultVision] = useState(config?.isDefaultVision ?? false);

  const handleProviderChange = (p: ProviderType) => {
    setProvider(p);
    const preset = getPresetById(p);
    if (preset) {
      setBaseUrl(preset.defaultBaseUrl);
      if (preset.modelSuggestions.length > 0 && !modelName) {
        setModelName(preset.modelSuggestions[0] ?? "");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      provider,
      authMode,
      baseUrl,
      apiKey,
      token,
      modelName,
      modelType,
      isDefaultText,
      isDefaultVision,
    });
  };

  const currentPreset = getPresetById(provider);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-bg-secondary rounded-lg w-full max-w-md border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium text-text-primary">
            {config ? t("settings.editModel") : t("settings.addModel")}
          </h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs text-text-secondary mb-1">{t("settings.modelName")}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-tertiary text-text-primary text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">{t("settings.provider")}</label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as ProviderType)}
              className="w-full bg-bg-tertiary text-text-primary text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent"
            >
              {PROVIDER_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">{t("settings.authMode")}</label>
            <select
              value={authMode}
              onChange={(e) => setAuthMode(e.target.value as AuthMode)}
              className="w-full bg-bg-tertiary text-text-primary text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent"
            >
              {currentPreset?.authModes.map((mode) => (
                <option key={mode} value={mode}>{getAuthModeLabel(mode)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">{t("settings.baseUrl")}</label>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full bg-bg-tertiary text-text-primary text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent font-mono text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">{t("settings.apiKey")}</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-bg-tertiary text-text-primary text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent font-mono text-xs"
              required
            />
          </div>

          {authMode === "token_plan" && (
            <div>
              <label className="block text-xs text-text-secondary mb-1">{t("settings.token")}</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-bg-tertiary text-text-primary text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent font-mono text-xs"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-text-secondary mb-1">{t("settings.modelId")}</label>
            <input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full bg-bg-tertiary text-text-primary text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent font-mono text-xs"
              list={`models-${provider}`}
              required
            />
            <datalist id={`models-${provider}`}>
              {currentPreset?.modelSuggestions.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">{t("settings.modelType")}</label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value as ModelType)}
              className="w-full bg-bg-tertiary text-text-primary text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent"
            >
              <option value="text">{t("settings.textModel")}</option>
              <option value="vision">{t("settings.visionModel")}</option>
              <option value="both">{t("settings.bothModel")}</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={isDefaultText}
                onChange={(e) => setIsDefaultText(e.target.checked)}
                className="rounded border-border"
              />
              {t("settings.defaultTextModel")}
            </label>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={isDefaultVision}
                onChange={(e) => setIsDefaultVision(e.target.checked)}
                className="rounded border-border"
              />
              {t("settings.defaultVisionModel")}
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
            >
              {t("settings.cancel")}
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-accent text-white rounded hover:bg-accent/90"
            >
              {t("settings.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
