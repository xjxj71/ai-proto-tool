import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PagePanel } from "@/components/editor/PagePanel";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import type { Page } from "@/types";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

const mockPages: Page[] = [
  {
    id: "page-1",
    projectId: "proj-1",
    name: "首页",
    thumbnail: "",
    sortOrder: 0,
    canvasWidth: 1440,
    canvasHeight: 900,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "page-2",
    projectId: "proj-1",
    name: "详情页",
    thumbnail: "",
    sortOrder: 1,
    canvasWidth: 1440,
    canvasHeight: 900,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

describe("PagePanel", () => {
  beforeEach(() => {
    useProjectStore.setState({ pages: mockPages });
    useUiStore.setState({ currentPageId: "page-1" });
  });

  it("should render page list with page names", () => {
    render(<PagePanel />);
    expect(screen.getByText("首页")).toBeInTheDocument();
    expect(screen.getByText("详情页")).toBeInTheDocument();
  });

  it("should highlight the active page", () => {
    render(<PagePanel />);
    const activeItem = screen.getByText("首页").closest("[class*='bg-accent']");
    expect(activeItem).toBeInTheDocument();
  });

  it("should render new page button", () => {
    render(<PagePanel />);
    expect(screen.getByTitle("新页面")).toBeInTheDocument();
  });

  it("should show empty state when no pages", () => {
    useProjectStore.setState({ pages: [] });
    render(<PagePanel />);
    expect(screen.getByText("暂无页面")).toBeInTheDocument();
  });

  it("should switch page on click", async () => {
    render(<PagePanel />);
    await userEvent.click(screen.getByText("详情页"));
    expect(useUiStore.getState().currentPageId).toBe("page-2");
  });
});
