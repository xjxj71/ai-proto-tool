import { describe, it, expect, beforeEach } from "vitest";
import { useModelStore } from "@/stores/modelStore";
import type { ModelConfig } from "@/types";

const mockConfig: ModelConfig = {
  id: "cfg-1",
  name: "GPT-4o",
  provider: "openai",
  authMode: "standard_api",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "sk-test",
  token: "",
  modelName: "gpt-4o",
  modelType: "both",
  isDefaultText: true,
  isDefaultVision: true,
  connectionStatus: "",
  lastTestedAt: "",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

describe("modelStore", () => {
  beforeEach(() => {
    useModelStore.setState({
      configs: [],
      defaultTextModel: null,
      defaultVisionModel: null,
    });
  });

  it("should start with empty configs", () => {
    expect(useModelStore.getState().configs).toEqual([]);
    expect(useModelStore.getState().defaultTextModel).toBeNull();
  });

  it("should set configs", () => {
    useModelStore.getState().setConfigs([mockConfig]);
    expect(useModelStore.getState().configs).toHaveLength(1);
  });

  it("should set default text model", () => {
    useModelStore.getState().setDefaultTextModel(mockConfig);
    expect(useModelStore.getState().defaultTextModel?.id).toBe("cfg-1");
  });

  it("should set default vision model", () => {
    useModelStore.getState().setDefaultVisionModel(mockConfig);
    expect(useModelStore.getState().defaultVisionModel?.id).toBe("cfg-1");
  });

  it("should derive default text model from configs", () => {
    useModelStore.getState().setConfigs([mockConfig]);
    const derived = useModelStore.getState().getDefaultTextModel();
    expect(derived?.id).toBe("cfg-1");
  });

  it("should derive default vision model from configs", () => {
    const textOnlyConfig = { ...mockConfig, id: "cfg-1", isDefaultText: true, isDefaultVision: false, modelType: "text" as const };
    const visionConfig = { ...mockConfig, id: "cfg-2", isDefaultText: false, isDefaultVision: true };
    useModelStore.getState().setConfigs([textOnlyConfig, visionConfig]);
    const derived = useModelStore.getState().getDefaultVisionModel();
    expect(derived?.id).toBe("cfg-2");
  });

  it("should clear all state", () => {
    useModelStore.getState().setConfigs([mockConfig]);
    useModelStore.getState().setDefaultTextModel(mockConfig);
    useModelStore.getState().clear();
    expect(useModelStore.getState().configs).toEqual([]);
    expect(useModelStore.getState().defaultTextModel).toBeNull();
  });
});
