import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatInput } from "@/components/chat/ChatInput";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("ChatInput", () => {
  it("should render input with placeholder", () => {
    render(<ChatInput onSend={vi.fn()} onCancel={vi.fn()} isLoading={false} />);
    expect(screen.getByPlaceholderText("chat.inputPlaceholder")).toBeInTheDocument();
  });

  it("should call onSend when text is entered and send is clicked", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} onCancel={vi.fn()} isLoading={false} />);

    const input = screen.getByPlaceholderText("chat.inputPlaceholder");
    fireEvent.change(input, { target: { value: "Build a page" } });
    fireEvent.click(screen.getByTitle("chat.send"));

    expect(onSend).toHaveBeenCalledWith("Build a page", []);
  });

  it("should show cancel button when loading", () => {
    render(<ChatInput onSend={vi.fn()} onCancel={vi.fn()} isLoading={true} />);
    expect(screen.getByTitle("chat.cancel")).toBeInTheDocument();
  });

  it("should not send empty text", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} onCancel={vi.fn()} isLoading={false} />);

    fireEvent.click(screen.getByTitle("chat.send"));
    expect(onSend).not.toHaveBeenCalled();
  });

  it("should send on Enter key", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} onCancel={vi.fn()} isLoading={false} />);

    const input = screen.getByPlaceholderText("chat.inputPlaceholder");
    fireEvent.change(input, { target: { value: "Test" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSend).toHaveBeenCalledWith("Test", []);
  });

  it("should not send on Shift+Enter", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} onCancel={vi.fn()} isLoading={false} />);

    const input = screen.getByPlaceholderText("chat.inputPlaceholder");
    fireEvent.change(input, { target: { value: "Test" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });
});
