import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toolbar } from "@/components/editor/Toolbar";
import { useUiStore } from "@/stores/uiStore";

describe("Toolbar", () => {
  it("should render all tool buttons", () => {
    render(<Toolbar />);
    expect(screen.getByTitle("选择")).toBeInTheDocument();
    expect(screen.getByTitle("画笔")).toBeInTheDocument();
    expect(screen.getByTitle("矩形")).toBeInTheDocument();
    expect(screen.getByTitle("文字")).toBeInTheDocument();
  });

  it("should highlight the active tool", () => {
    useUiStore.setState({ activeTool: "pen" });
    render(<Toolbar />);
    const penButton = screen.getByTitle("画笔");
    expect(penButton.className).toContain("bg-accent");
  });

  it("should switch tool on click", async () => {
    useUiStore.setState({ activeTool: "select" });
    render(<Toolbar />);
    await userEvent.click(screen.getByTitle("画笔"));
    expect(useUiStore.getState().activeTool).toBe("pen");
  });

  it("should render canvas mode toggle button", () => {
    useUiStore.setState({ canvasMode: "design" });
    render(<Toolbar />);
    expect(screen.getByTitle("手绘模式")).toBeInTheDocument();
  });

  it("should toggle canvas mode on click", async () => {
    useUiStore.setState({ canvasMode: "design" });
    render(<Toolbar />);
    await userEvent.click(screen.getByTitle("手绘模式"));
    expect(useUiStore.getState().canvasMode).toBe("sketch");
  });

  it("should render grid toggle button", () => {
    render(<Toolbar />);
    expect(screen.getByTitle("网格")).toBeInTheDocument();
  });
});
