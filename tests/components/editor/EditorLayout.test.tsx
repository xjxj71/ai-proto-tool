import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";
import type { Page } from "@/types";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/components/canvas/CanvasRenderer", () => ({
  CanvasRenderer: () => <div data-testid="canvas-renderer" />,
}));

vi.mock("@/components/canvas/ViewportControls", () => ({
  ViewportControls: () => null,
}));

vi.mock("@/components/canvas/GridOverlay", () => ({
  createGridOverlay: () => ({
    showGrid: vi.fn(),
    hideGrid: vi.fn(),
    enableSnapToGrid: vi.fn(),
    disableSnapToGrid: vi.fn(),
  }),
}));

vi.mock("@/components/canvas/modes/canvasModes", () => ({
  applyCanvasMode: vi.fn(),
}));

const mockPages: Page[] = [
  {
    id: "page-1",
    projectId: "proj-1",
    name: "Home",
    thumbnail: "",
    sortOrder: 0,
    canvasWidth: 1440,
    canvasHeight: 900,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

describe("EditorLayout", () => {
  beforeEach(() => {
    useUiStore.setState({ view: "editor", currentPageId: "page-1" });
    useProjectStore.setState({
      currentProject: {
        id: "proj-1",
        name: "Test",
        description: "",
        coverImage: "",
        canvasPreset: "desktop_1440x900",
        createdAt: "",
        updatedAt: "",
      },
      pages: mockPages,
    });
    useCanvasStore.setState({ saveStatus: "saved" });
  });

  it("should render page panel", () => {
    render(<EditorLayout />);
    expect(screen.getByText("页面")).toBeInTheDocument();
  });

  it("should render status bar with save status", () => {
    render(<EditorLayout />);
    expect(screen.getByText("已保存")).toBeInTheDocument();
  });

  it("should render toolbar with tool buttons", () => {
    render(<EditorLayout />);
    expect(screen.getByTitle("选择")).toBeInTheDocument();
  });

  it("should show page content in page panel", () => {
    render(<EditorLayout />);
    expect(screen.getByText("Home")).toBeInTheDocument();
  });
});
