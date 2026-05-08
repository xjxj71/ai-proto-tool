import type { ModelConfig, AuthMode } from "@/types";
import { BaseProvider } from "./BaseProvider";

export class AnthropicProvider extends BaseProvider {
  readonly id = "anthropic";
  readonly name = "Anthropic";

  getSupportedAuthModes(): AuthMode[] {
    return ["standard_api"];
  }

  getDefaultHeaders(config: ModelConfig): Record<string, string> {
    return {
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    };
  }
}
