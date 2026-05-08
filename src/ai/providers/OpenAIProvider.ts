import type { ModelConfig, AuthMode } from "@/types";
import { BaseProvider } from "./BaseProvider";

export class OpenAIProvider extends BaseProvider {
  readonly id = "openai";
  readonly name = "OpenAI";

  getSupportedAuthModes(): AuthMode[] {
    return ["standard_api"];
  }

  getDefaultHeaders(config: ModelConfig): Record<string, string> {
    return {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    };
  }
}
