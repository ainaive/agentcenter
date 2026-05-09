// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DeptPicker } from "./dept-picker";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockUpdate = vi.fn();
const mockUseFilters = vi.fn();
vi.mock("@/lib/hooks/use-filters", () => ({
  useFilters: () => mockUseFilters(),
}));

// Inline the popover so the test renders the panel without the Base UI
// portal/positioner machinery (which doesn't behave inside happy-dom). The
// test-id lets us scope queries to the panel and avoid name collisions with
// the trigger button.
vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverTrigger: ({ render }: { render: React.ReactNode }) => <>{render}</>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dept-popover-panel">{children}</div>
  ),
}));

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mockUseFilters.mockReturnValue({ filters: {}, update: mockUpdate });
});

function panel() {
  return within(screen.getByTestId("dept-popover-panel"));
}

describe("DeptPicker", () => {
  it("marks the My Department chip pressed when no dept filter is set", () => {
    render(<DeptPicker />);
    expect(panel().getByRole("button", { name: "mine" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("clears the dept filter when My Department is clicked", async () => {
    mockUseFilters.mockReturnValue({
      filters: { dept: "eng.cloud" },
      update: mockUpdate,
    });
    const user = userEvent.setup();
    render(<DeptPicker />);

    await user.click(panel().getByRole("button", { name: "mine" }));

    expect(mockUpdate).toHaveBeenCalledWith({ dept: undefined });
  });

  it("dispatches the All Departments token when its chip is clicked", async () => {
    const user = userEvent.setup();
    render(<DeptPicker />);

    await user.click(panel().getByRole("button", { name: "all" }));

    expect(mockUpdate).toHaveBeenCalledWith({ dept: "__all" });
  });

  it("dispatches the org id when My Org is clicked", async () => {
    const user = userEvent.setup();
    render(<DeptPicker />);

    await user.click(panel().getByRole("button", { name: "org" }));

    expect(mockUpdate).toHaveBeenCalledWith({ dept: "eng" });
  });

  it("marks the All chip pressed when filters.dept is __all", () => {
    mockUseFilters.mockReturnValue({
      filters: { dept: "__all" },
      update: mockUpdate,
    });
    render(<DeptPicker />);
    expect(panel().getByRole("button", { name: "all" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
