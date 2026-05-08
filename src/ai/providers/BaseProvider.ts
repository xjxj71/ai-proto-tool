import type { ModelConfig, AuthMode } from "@/types";

export interface ProviderValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ProviderCapabilities {
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsToolUse: boolean;
  maxContextTokens: number;
}

export abstract class BaseProvider {
  abstract readonly id: string;
  abstract readonly name: string;

  getCapabilities(modelType: string): ProviderCapabilities {
    return {
      supportsStreaming: true,
      supportsVision: modelType === "vision" || modelType === "both",
      supportsToolUse: true,
      maxContextTokens: 128_000,
    };
  }

  validateConfig(config: ModelConfig): ProviderValidationResult {
    const errors: string[] = [];

    if (!config.modelName.trim()) {
      errors.push("Model name is required");
    }

    if (!this.validateAuth(config.authMode, config)) {
      errors.push(`Invalid authentication for ${this.name}`);
    }

    if (!config.baseUrl.trim()) {
      errors.push("Base URL is required");
    }

    return { valid: errors.length === 0, errors };
  }

  protected validateAuth(authMode: AuthMode, config: ModelConfig): boolean {
    switch (authMode) {
      case "standard_api":
        return !!config.apiKey.trim();
      case "token_plan":
        return !!config.token.trim();
      case "coding_plan":
        return !!config.apiKey.trim();
      default:
        return false;
    }
  }

  abstract getSupportedAuthModes(): AuthMode[];
  abstract getDefaultHeaders(config: ModelConfig): Record<string, string>;
}
