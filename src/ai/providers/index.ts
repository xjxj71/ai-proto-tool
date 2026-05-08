import type { ProviderType, ModelConfig } from "@/types";
import { BaseProvider } from "./BaseProvider";
import { OpenAIProvider } from "./OpenAIProvider";
import { AnthropicProvider } from "./AnthropicProvider";
import { GeminiProvider } from "./GeminiProvider";

const providers: Record<string, BaseProvider> = {
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
  gemini: new GeminiProvider(),
};

export function getProvider(type: ProviderType): BaseProvider | null {
  return providers[type] ?? null;
}

export function validateModelConfig(config: ModelConfig): { valid: boolean; errors: string[] } {
  const provider = getProvider(config.provider as ProviderType);
  if (!provider) {
    return { valid: false, errors: [`Unknown provider: ${config.provider}`] };
  }
  return provider.validateConfig(config);
}

export { BaseProvider, OpenAIProvider, AnthropicProvider, GeminiProvider };
