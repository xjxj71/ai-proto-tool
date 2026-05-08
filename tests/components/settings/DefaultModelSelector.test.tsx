import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DefaultModelSelector } from "@/components/settings/DefaultModelSelector";
import { useModelStore } from "@/stores/modelStore";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("DefaultModelSelector", () => {
  beforeEach(() => {
    useModelStore.setState({
      configs: [],
      defaultTextModel: null,
      defaultVisionModel: null,
    });
  });

  it("should render with label", () => {
    render(<DefaultModelSelector type="text" />);
    expect(screen.getByText("settings.defaultTextModel")).toBeInTheDocument();
  });

  it("should render vision label", () => {
    render(<DefaultModelSelector type="vision" />);
    expect(screen.getByText("settings.defaultVisionModel")).toBeInTheDocument();
  });

  it("should show empty select when no configs", () => {
    render(<DefaultModelSelector type="text" />);
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
  });

  it("should show config options when available", () => {
    useModelStore.setState({
      configs: [
        {
          id: "cfg-1",
          name: "GPT-4o",
          provider: "openai",
          authMode: "standard_api",
          baseUrl: "",
          apiKey: "",
          token: "",
          modelName: "gpt-4o",
          modelType: "both",
          isDefaultText: true,
          isDefaultVision: false,
          connectionStatus: "",
          lastTestedAt: "",
          createdAt: "",
          updatedAt: "",
        },
      ],
    });

    render(<DefaultModelSelector type="text" />);
    expect(screen.getByText("GPT-4o")).toBeInTheDocument();
  });
});
