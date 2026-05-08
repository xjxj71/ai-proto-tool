import { describe, it, expect } from "vitest";
import { getProvider, validateModelConfig } from "@/ai/providers";
import { OpenAIProvider } from "@/ai/providers/OpenAIProvider";
import { AnthropicProvider } from "@/ai/providers/AnthropicProvider";
import { GeminiProvider } from "@/ai/providers/GeminiProvider";
import type { ModelConfig } from "@/types";

function makeConfig(overrides: Partial<ModelConfig> = {}): ModelConfig {
  return {
    id: "test-id",
    name: "Test",
    provider: "openai",
    authMode: "standard_api",
    baseUrl: "https://api.openai.com/v1",
    apiKey: "sk-test-key",
    token: "",
    modelName: "gpt-4o",
    modelType: "text",
    isDefaultText: true,
    isDefaultVision: false,
    connectionStatus: "unknown",
    lastTestedAt: "",
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

describe("getProvider", () => {
  it("returns OpenAIProvider for openai", () => {
    const p = getProvider("openai");
    expect(p).instanceOf(OpenAIProvider);
  });

  it("returns AnthropicProvider for anthropic", () => {
    const p = getProvider("anthropic");
    expect(p).instanceOf(AnthropicProvider);
  });

  it("returns GeminiProvider for gemini", () => {
    const p = getProvider("gemini");
    expect(p).instanceOf(GeminiProvider);
  });

  it("returns null for unknown provider", () => {
    expect(getProvider("custom" as never)).toBeNull();
  });
});

describe("validateModelConfig", () => {
  it("validates a correct config", () => {
    const result = validateModelConfig(makeConfig());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing model name", () => {
    const result = validateModelConfig(makeConfig({ modelName: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Model name is required");
  });

  it("rejects missing api key for standard_api auth", () => {
    const result = validateModelConfig(makeConfig({ apiKey: "" }));
    expect(result.valid).toBe(false);
  });

  it("rejects missing base url", () => {
    const result = validateModelConfig(makeConfig({ baseUrl: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Base URL is required");
  });

  it("rejects unknown provider", () => {
    const result = validateModelConfig(makeConfig({ provider: "nonexistent" as never }));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Unknown provider");
  });
});

describe("provider headers", () => {
  it("OpenAI uses Bearer token", () => {
    const p = new OpenAIProvider();
    const headers = p.getDefaultHeaders(makeConfig({ apiKey: "sk-123" }));
    expect(headers["Authorization"]).toBe("Bearer sk-123");
  });

  it("Anthropic uses x-api-key", () => {
    const p = new AnthropicProvider();
    const headers = p.getDefaultHeaders(makeConfig({ apiKey: "ant-123", provider: "anthropic" }));
    expect(headers["x-api-key"]).toBe("ant-123");
    expect(headers["anthropic-version"]).toBe("2023-06-01");
  });

  it("Gemini uses x-goog-api-key", () => {
    const p = new GeminiProvider();
    const headers = p.getDefaultHeaders(makeConfig({ apiKey: "gem-123", provider: "gemini" }));
    expect(headers["x-goog-api-key"]).toBe("gem-123");
  });
});
