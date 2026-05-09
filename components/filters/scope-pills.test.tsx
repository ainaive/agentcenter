// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ScopePills } from "./scope-pills";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockUpdate = vi.fn();
const mockUseFilters = vi.fn();
vi.mock("@/lib/hooks/use-filters", () => ({
  useFilters: () => mockUseFilters(),
}));

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mockUseFilters.mockReturnValue({ filters: {}, update: mockUpdate });
});

describe("ScopePills", () => {
  it("renders the four scope pills", () => {
    render(<ScopePills />);
    for (const key of ["all", "personal", "org", "enterprise"]) {
      expect(
        screen.getByRole("button", { name: `scope.${key}` }),
      ).toBeInTheDocument();
    }
  });

  it("marks All active when no scope is set", () => {
    render(<ScopePills />);
    expect(
      screen.getByRole("button", { name: "scope.all" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("reflects the active scope via aria-pressed", () => {
    mockUseFilters.mockReturnValue({
      filters: { scope: "enterprise" },
      update: mockUpdate,
    });
    render(<ScopePills />);
    expect(
      screen.getByRole("button", { name: "scope.enterprise" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("dispatches the scope key on click", async () => {
    const user = userEvent.setup();
    render(<ScopePills />);

    await user.click(screen.getByRole("button", { name: "scope.personal" }));

    expect(mockUpdate).toHaveBeenCalledWith({ scope: "personal" });
  });

  it("clears the scope when All is clicked", async () => {
    const user = userEvent.setup();
    render(<ScopePills />);

    await user.click(screen.getByRole("button", { name: "scope.all" }));

    expect(mockUpdate).toHaveBeenCalledWith({ scope: undefined });
  });

  it("groups pills under the Scope label", () => {
    render(<ScopePills />);
    // aria-labelledby points to the visible "Scope:" span — the trailing
    // colon is part of the accessible name.
    expect(
      screen.getByRole("group", { name: /scopeLabel/ }),
    ).toBeInTheDocument();
  });
});
