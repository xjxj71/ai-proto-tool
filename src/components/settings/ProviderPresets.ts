import type { ProviderPreset, AuthMode } from "@/types";

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "openai",
    name: "OpenAI",
    defaultBaseUrl: "https://api.openai.com/v1",
    authModes: ["standard_api"],
    supportedModelTypes: ["text", "vision", "both"],
    modelSuggestions: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    defaultBaseUrl: "https://api.anthropic.com",
    authModes: ["standard_api"],
    supportedModelTypes: ["text", "vision", "both"],
    modelSuggestions: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    defaultBaseUrl: "https://generativelanguage.googleapis.com",
    authModes: ["standard_api"],
    supportedModelTypes: ["text", "vision", "both"],
    modelSuggestions: ["gemini-2.0-flash", "gemini-1.5-pro"],
  },
  {
    id: "qwen",
    name: "通义千问",
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    authModes: ["standard_api"],
    supportedModelTypes: ["text", "vision", "both"],
    modelSuggestions: ["qwen-max", "qwen-plus", "qwen-vl-max"],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    authModes: ["standard_api"],
    supportedModelTypes: ["text"],
    modelSuggestions: ["deepseek-chat", "deepseek-reasoner"],
  },
  {
    id: "moonshot",
    name: "Moonshot",
    defaultBaseUrl: "https://api.moonshot.cn/v1",
    authModes: ["standard_api"],
    supportedModelTypes: ["text"],
    modelSuggestions: ["moonshot-v1-8k", "moonshot-v1-32k"],
  },
  {
    id: "doubao",
    name: "豆包",
    defaultBaseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    authModes: ["standard_api"],
    supportedModelTypes: ["text", "vision", "both"],
    modelSuggestions: ["doubao-pro-32k", "doubao-vision-pro-32k"],
  },
  {
    id: "xiaomi",
    name: "小米 MIMO",
    defaultBaseUrl: "https://api.xiaomi.com/v1",
    authModes: ["standard_api", "token_plan"],
    supportedModelTypes: ["text", "vision", "both"],
    modelSuggestions: ["mimo", "mimo-vision"],
  },
  {
    id: "zhipu",
    name: "智谱 GLM",
    defaultBaseUrl: "https://open.bigmodel.cn/api/paas/v4",
    authModes: ["standard_api", "coding_plan"],
    supportedModelTypes: ["text", "vision", "both"],
    modelSuggestions: ["glm-4", "glm-4v"],
  },
  {
    id: "custom",
    name: "自定义",
    defaultBaseUrl: "",
    authModes: ["standard_api"],
    supportedModelTypes: ["text", "vision", "both"],
    modelSuggestions: [],
  },
];

export function getPresetById(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((p) => p.id === id);
}

export function getAuthModeLabel(mode: AuthMode): string {
  const labels: Record<AuthMode, string> = {
    standard_api: "标准 API",
    token_plan: "Token Plan",
    coding_plan: "Coding Plan",
  };
  return labels[mode];
}
