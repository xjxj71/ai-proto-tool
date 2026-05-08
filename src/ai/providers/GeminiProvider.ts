import type { ModelConfig, AuthMode } from "@/types";
import { BaseProvider } from "./BaseProvider";

export class GeminiProvider extends BaseProvider {
  readonly id = "gemini";
  readonly name = "Google Gemini";

  getSupportedAuthModes(): AuthMode[] {
    return ["standard_api"];
  }

  getDefaultHeaders(config: ModelConfig): Record<string, string> {
    return {
      "x-goog-api-key": config.apiKey,
      "Content-Type": "application/json",
    };
  }
}
