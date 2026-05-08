import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModelConfigDialog } from "@/components/settings/ModelConfigDialog";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("ModelConfigDialog", () => {
  it("should render add mode", () => {
    render(<ModelConfigDialog onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("settings.addModel")).toBeInTheDocument();
  });

  it("should render edit mode with existing config", () => {
    const config = {
      id: "cfg-1",
      name: "GPT-4o",
      provider: "openai",
      authMode: "standard_api",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "sk-test",
      token: "",
      modelName: "gpt-4o",
      modelType: "both" as const,
      isDefaultText: true,
      isDefaultVision: false,
      connectionStatus: "",
      lastTestedAt: "",
      createdAt: "",
      updatedAt: "",
    };
    render(<ModelConfigDialog config={config} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("settings.editModel")).toBeInTheDocument();
  });

  it("should call onClose when clicking overlay", () => {
    const onClose = vi.fn();
    render(<ModelConfigDialog onSave={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByText("settings.addModel").closest(".fixed")!);
    expect(onClose).toHaveBeenCalled();
  });

  it("should have provider dropdown", () => {
    render(<ModelConfigDialog onSave={vi.fn()} onClose={vi.fn()} />);
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });
});
