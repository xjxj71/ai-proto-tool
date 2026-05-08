import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { useChatStore } from "@/stores/chatStore";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("ChatMessageList", () => {
  it("should show placeholder when no messages", () => {
    useChatStore.setState({
      messages: [],
      streamingContent: "",
      isStreaming: false,
    });

    render(<ChatMessageList />);
    expect(screen.getByText("chat.noMessages")).toBeInTheDocument();
  });

  it("should render messages", () => {
    useChatStore.setState({
      messages: [
        { id: "1", role: "user", content: "Hello", images: [], timestamp: "2026-01-01" },
        { id: "2", role: "assistant", content: "Hi there", images: [], timestamp: "2026-01-01" },
      ],
      streamingContent: "",
      isStreaming: false,
    });

    render(<ChatMessageList />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi there")).toBeInTheDocument();
  });
});
