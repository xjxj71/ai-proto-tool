import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MenuBar } from "@/components/editor/MenuBar";

describe("MenuBar", () => {
  it("should render menu items", () => {
    render(<MenuBar />);
    expect(screen.getByText("文件")).toBeInTheDocument();
    expect(screen.getByText("编辑")).toBeInTheDocument();
    expect(screen.getByText("视图")).toBeInTheDocument();
    expect(screen.getByText("导出")).toBeInTheDocument();
  });
});
