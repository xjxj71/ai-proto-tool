import { create } from "zustand";
import type { ModelConfig } from "@/types";

interface ModelState {
  configs: ModelConfig[];
  defaultTextModel: ModelConfig | null;
  defaultVisionModel: ModelConfig | null;

  setConfigs: (configs: ModelConfig[]) => void;
  setDefaultTextModel: (model: ModelConfig | null) => void;
  setDefaultVisionModel: (model: ModelConfig | null) => void;
  getDefaultTextModel: () => ModelConfig | null;
  getDefaultVisionModel: () => ModelConfig | null;
  clear: () => void;
}

export const useModelStore = create<ModelState>((set, get) => ({
  configs: [],
  defaultTextModel: null,
  defaultVisionModel: null,

  setConfigs: (configs) => {
    const defaultText = configs.find((c) => c.isDefaultText) ?? null;
    const defaultVision = configs.find((c) => c.isDefaultVision) ?? null;
    set({
      configs,
      defaultTextModel: defaultText,
      defaultVisionModel: defaultVision,
    });
  },

  setDefaultTextModel: (defaultTextModel) => set({ defaultTextModel }),
  setDefaultVisionModel: (defaultVisionModel) => set({ defaultVisionModel }),

  getDefaultTextModel: () => {
    const { configs, defaultTextModel } = get();
    if (defaultTextModel) return defaultTextModel;
    return configs.find((c) => c.isDefaultText) ?? configs.find((c) => c.modelType === "text" || c.modelType === "both") ?? null;
  },

  getDefaultVisionModel: () => {
    const { configs, defaultVisionModel } = get();
    if (defaultVisionModel) return defaultVisionModel;
    return configs.find((c) => c.isDefaultVision) ?? configs.find((c) => c.modelType === "vision" || c.modelType === "both") ?? null;
  },

  clear: () => set({ configs: [], defaultTextModel: null, defaultVisionModel: null }),
}));
