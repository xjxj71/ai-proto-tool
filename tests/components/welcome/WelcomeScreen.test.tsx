import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WelcomeScreen } from "@/components/welcome/WelcomeScreen";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue([]),
}));

describe("WelcomeScreen", () => {
  it("should render welcome title", () => {
    render(<WelcomeScreen />);
    expect(screen.getByText("欢迎使用 AI-Proto-Tool")).toBeInTheDocument();
  });

  it("should render new project button", () => {
    render(<WelcomeScreen />);
    expect(screen.getByText("新建项目")).toBeInTheDocument();
  });

  it("should show empty state when no projects", () => {
    render(<WelcomeScreen />);
    expect(screen.getByText(/还没有项目/)).toBeInTheDocument();
  });
});
