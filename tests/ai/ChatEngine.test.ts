import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatEngine } from "@/components/ai/ChatEngine";
import type { ChatMessage, ModelConfig } from "@/types";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

const mockModelConfig: ModelConfig = {
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
  connectionStatus: "ok",
  lastTestedAt: "",
  createdAt: "",
  updatedAt: "",
};

describe("ChatEngine", () => {
  let engine: ChatEngine;

  beforeEach(() => {
    engine = new ChatEngine();
    vi.clearAllMocks();
  });

  it("should generate a unique request ID", () => {
    const id1 = engine.generateRequestId();
    const id2 = engine.generateRequestId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^req-/);
  });

  it("should build request config with system prompt and messages", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "user", content: "Build a landing page", images: [], timestamp: "" },
    ];

    const config = engine.buildRequest({
      modelConfig: mockModelConfig,
      messages,
      canvasJSON: '{"version":"6","objects":[]}',
      canvasWidth: 1440,
      canvasHeight: 900,
    });

    expect(config.modelConfigId).toBe("cfg-1");
    expect(config.stream).toBe(true);
    expect(config.messages.length).toBeGreaterThan(1);
    expect(config.messages[0].role).toBe("system");
  });

  it("should include canvas context as first user message part", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "user", content: "Build a page", images: [], timestamp: "" },
    ];

    const config = engine.buildRequest({
      modelConfig: mockModelConfig,
      messages,
      canvasJSON: '{"version":"6","objects":[{"type":"rect"}]}',
      canvasWidth: 1440,
      canvasHeight: 900,
    });

    expect(config.messages.length).toBeGreaterThanOrEqual(2);
  });

  it("should handle messages with images", () => {
    const messages: ChatMessage[] = [
      {
        id: "1",
        role: "user",
        content: "Look at this sketch",
        images: ["data:image/png;base64,abc"],
        timestamp: "",
      },
    ];

    const config = engine.buildRequest({
      modelConfig: mockModelConfig,
      messages,
      canvasJSON: '{"version":"6","objects":[]}',
      canvasWidth: 1440,
      canvasHeight: 900,
    });

    const withImage = config.messages.find(
      (m) => Array.isArray(m.content)
    );
    expect(withImage).toBeDefined();
  });

  it("should reject send when no model config is provided", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "user", content: "Build a landing page", images: [], timestamp: "" },
    ];

    expect(() => engine.buildRequest({
      modelConfig: null as any,
      messages,
      canvasJSON: '{"version":"6","objects":[]}',
      canvasWidth: 1440,
      canvasHeight: 900,
    })).toThrow();
  });

  it("should select text model by default", () => {
    const config = engine.buildRequest({
      modelConfig: mockModelConfig,
      messages: [{ id: "1", role: "user", content: "Test", images: [], timestamp: "" }],
      canvasJSON: '{"version":"6","objects":[]}',
      canvasWidth: 1440,
      canvasHeight: 900,
    });

    expect(config.modelConfigId).toBe("cfg-1");
  });

  it("should use vision model when images are present", () => {
    const visionConfig = { ...mockModelConfig, id: "cfg-vision", modelType: "vision" as const };
    const config = engine.buildRequest({
      modelConfig: visionConfig,
      messages: [{
        id: "1", role: "user", content: "Analyze",
        images: ["data:image/png;base64,abc"], timestamp: "",
      }],
      canvasJSON: '{"version":"6","objects":[]}',
      canvasWidth: 1440,
      canvasHeight: 900,
    });

    expect(config.modelConfigId).toBe("cfg-vision");
  });
});
