import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBar } from "@/components/editor/StatusBar";

describe("StatusBar", () => {
  it("should render saved status", () => {
    render(<StatusBar />);
    expect(screen.getByText("已保存")).toBeInTheDocument();
  });
});
