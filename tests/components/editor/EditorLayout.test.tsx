import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditorLayout } from "@/components/editor/EditorLayout";

describe("EditorLayout", () => {
  it("should render all major sections", () => {
    render(<EditorLayout />);
    expect(screen.getByText("画板工作区")).toBeInTheDocument();
    expect(screen.getByText("AI 对话面板")).toBeInTheDocument();
    expect(screen.getByText("暂无页面")).toBeInTheDocument();
  });

  it("should render status bar", () => {
    render(<EditorLayout />);
    expect(screen.getByText("已保存")).toBeInTheDocument();
  });
});
