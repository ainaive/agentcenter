// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FilterChips } from "./filter-chips";

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

describe("FilterChips", () => {
  it("renders all five chips", () => {
    render(<FilterChips />);
    for (const key of ["all", "trending", "new", "official", "free"]) {
      expect(
        screen.getByRole("button", { name: `chips.${key}` }),
      ).toBeInTheDocument();
    }
  });

  it("marks the All chip active by default", () => {
    render(<FilterChips />);
    expect(
      screen.getByRole("button", { name: "chips.all" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("reflects the active filter via aria-pressed", () => {
    mockUseFilters.mockReturnValue({
      filters: { filter: "official" },
      update: mockUpdate,
    });
    render(<FilterChips />);
    expect(
      screen.getByRole("button", { name: "chips.official" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "chips.trending" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("dispatches the filter key on click", async () => {
    const user = userEvent.setup();
    render(<FilterChips />);

    await user.click(screen.getByRole("button", { name: "chips.trending" }));

    expect(mockUpdate).toHaveBeenCalledWith({ filter: "trending" });
  });

  it("clears the filter when All is clicked", async () => {
    const user = userEvent.setup();
    render(<FilterChips />);

    await user.click(screen.getByRole("button", { name: "chips.all" }));

    expect(mockUpdate).toHaveBeenCalledWith({ filter: undefined });
  });

  it("wraps chips in a labelled group", () => {
    render(<FilterChips />);
    expect(
      screen.getByRole("group", { name: "filtersLabel" }),
    ).toBeInTheDocument();
  });
});
