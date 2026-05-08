import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useSettingsStore } from "@/stores/settingsStore";

describe("ThemeToggle", () => {
  it("should render a toggle button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should show current theme as button text", () => {
    useSettingsStore.setState({ theme: "dark" });
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveTextContent("亮色");
  });

  it("should toggle theme on click", async () => {
    useSettingsStore.setState({ theme: "dark" });
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button"));
    expect(useSettingsStore.getState().theme).toBe("light");
  });
});
