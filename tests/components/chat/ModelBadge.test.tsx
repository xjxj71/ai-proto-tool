import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModelBadge } from "@/components/chat/ModelBadge";
import { useModelStore } from "@/stores/modelStore";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("ModelBadge", () => {
  beforeEach(() => {
    useModelStore.setState({
      configs: [],
      defaultTextModel: null,
      defaultVisionModel: null,
    });
  });

  it("should render nothing when no model configured", () => {
    const { container } = render(<ModelBadge type="text" />);
    expect(container.innerHTML).toBe("");
  });

  it("should render model name when configured", () => {
    useModelStore.setState({
      defaultTextModel: {
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
    });

    render(<ModelBadge type="text" />);
    expect(screen.getByText("GPT-4o")).toBeInTheDocument();
  });
});
