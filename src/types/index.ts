export interface Project {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  canvasPreset: string;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  projectId: string;
  name: string;
  thumbnail: string;
  sortOrder: number;
  canvasWidth: number;
  canvasHeight: number;
  createdAt: string;
  updatedAt: string;
}

export type AuthMode = "standard_api" | "token_plan" | "coding_plan";
export type ModelType = "text" | "vision" | "both";

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  authMode: AuthMode;
  baseUrl: string;
  apiKey: string;
  token: string;
  modelName: string;
  modelType: ModelType;
  isDefaultText: boolean;
  isDefaultVision: boolean;
  connectionStatus: string;
  lastTestedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type ThemeMode = "dark" | "light";

export interface AppSettings {
  theme: ThemeMode;
  language: string;
  defaultCanvasPreset: string;
}

export type CanvasPreset = {
  name: string;
  width: number;
  height: number;
  category: "desktop" | "tablet" | "mobile";
};

export const CANVAS_PRESETS: CanvasPreset[] = [
  { name: "桌面 1440x900", width: 1440, height: 900, category: "desktop" },
  { name: "桌面 1280x800", width: 1280, height: 800, category: "desktop" },
  { name: "桌面 1920x1080", width: 1920, height: 1080, category: "desktop" },
  { name: "平板 1024x768", width: 1024, height: 768, category: "tablet" },
  { name: "平板 768x1024", width: 768, height: 1024, category: "tablet" },
  { name: "手机 375x812", width: 375, height: 812, category: "mobile" },
  { name: "手机 390x844", width: 390, height: 844, category: "mobile" },
];
