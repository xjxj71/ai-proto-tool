import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBar } from "@/components/editor/StatusBar";
import { useCanvasStore } from "@/stores/canvasStore";

describe("StatusBar", () => {
  it("should render saved status", () => {
    useCanvasStore.setState({ saveStatus: "saved" });
    render(<StatusBar />);
    expect(screen.getByText("已保存")).toBeInTheDocument();
  });

  it("should render saving status", () => {
    useCanvasStore.setState({ saveStatus: "saving" });
    render(<StatusBar />);
    expect(screen.getByText("保存中...")).toBeInTheDocument();
  });

  it("should render unsaved status", () => {
    useCanvasStore.setState({ saveStatus: "unsaved" });
    render(<StatusBar />);
    expect(screen.getByText("未保存")).toBeInTheDocument();
  });
});
