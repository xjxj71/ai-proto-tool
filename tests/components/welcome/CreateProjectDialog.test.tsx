import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateProjectDialog } from "@/components/welcome/CreateProjectDialog";

describe("CreateProjectDialog", () => {
  it("should render project name input", () => {
    render(<CreateProjectDialog open={true} onClose={() => {}} onSubmit={() => {}} />);
    expect(screen.getByLabelText("项目名称")).toBeInTheDocument();
  });

  it("should render create and cancel buttons", () => {
    render(<CreateProjectDialog open={true} onClose={() => {}} onSubmit={() => {}} />);
    expect(screen.getByRole("button", { name: "创建项目" })).toBeInTheDocument();
    expect(screen.getByText("取消")).toBeInTheDocument();
  });

  it("should call onSubmit with form data", async () => {
    const handleSubmit = vi.fn();
    render(<CreateProjectDialog open={true} onClose={() => {}} onSubmit={handleSubmit} />);

    await userEvent.type(screen.getByLabelText("项目名称"), "My Project");
    await userEvent.click(screen.getByRole("button", { name: "创建项目" }));

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "My Project" }),
    );
  });

  it("should not submit with empty name", async () => {
    const handleSubmit = vi.fn();
    render(<CreateProjectDialog open={true} onClose={() => {}} onSubmit={handleSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: "创建项目" }));
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
