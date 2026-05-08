import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "@/App";
import { useUiStore } from "@/stores/uiStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue([]),
}));

describe("App", () => {
  it("should show welcome screen by default", () => {
    render(<App />);
    expect(screen.getByText("欢迎使用 AI-Proto-Tool")).toBeInTheDocument();
  });

  it("should show editor when view is set to editor", () => {
    useUiStore.getState().setView("editor");
    render(<App />);
    expect(screen.getByText("请从左侧面板选择或创建页面")).toBeInTheDocument();
  });
});
