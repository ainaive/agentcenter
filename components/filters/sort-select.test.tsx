// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SortSelect } from "./sort-select";

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

describe("SortSelect", () => {
  it("renders the three sort options", () => {
    render(<SortSelect />);
    const select = screen.getByRole("combobox");
    expect(select).toHaveDisplayValue(/sort\.downloads/);
    expect(screen.getByRole("option", { name: "sort.downloads" }))
      .toBeInTheDocument();
    expect(screen.getByRole("option", { name: "sort.stars" }))
      .toBeInTheDocument();
    expect(screen.getByRole("option", { name: "sort.recent" }))
      .toBeInTheDocument();
  });

  it("defaults to downloads when no sort is set", () => {
    render(<SortSelect />);
    expect(screen.getByRole("combobox")).toHaveValue("downloads");
  });

  it("reflects the active sort", () => {
    mockUseFilters.mockReturnValue({
      filters: { sort: "stars" },
      update: mockUpdate,
    });
    render(<SortSelect />);
    expect(screen.getByRole("combobox")).toHaveValue("stars");
  });

  it("dispatches the new sort on change", async () => {
    const user = userEvent.setup();
    render(<SortSelect />);

    await user.selectOptions(screen.getByRole("combobox"), "recent");

    expect(mockUpdate).toHaveBeenCalledWith({ sort: "recent" });
  });
});
