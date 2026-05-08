import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ElementContextMenu } from "@/components/editor/ElementContextMenu";

describe("ElementContextMenu", () => {
  it("should render menu at specified position", () => {
    render(
      <ElementContextMenu
        x={100}
        y={200}
        elementId="el-1"
        hasLink={false}
        onSetLink={() => {}}
        onEditLink={() => {}}
        onRemoveLink={() => {}}
        onClose={() => {}}
      />,
    );
    const menu = screen.getByText("设置链接").closest("div");
    expect(menu).toBeInTheDocument();
    expect(menu?.style.left).toBe("100px");
    expect(menu?.style.top).toBe("200px");
  });

  it("should show remove link option when hasLink is true", () => {
    render(
      <ElementContextMenu
        x={100}
        y={200}
        elementId="el-1"
        hasLink={true}
        onSetLink={() => {}}
        onEditLink={() => {}}
        onRemoveLink={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("编辑链接")).toBeInTheDocument();
    expect(screen.getByText("移除链接")).toBeInTheDocument();
  });

  it("should not show remove link option when hasLink is false", () => {
    render(
      <ElementContextMenu
        x={100}
        y={200}
        elementId="el-1"
        hasLink={false}
        onSetLink={() => {}}
        onEditLink={() => {}}
        onRemoveLink={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("设置链接")).toBeInTheDocument();
    expect(screen.queryByText("移除链接")).not.toBeInTheDocument();
  });
});
