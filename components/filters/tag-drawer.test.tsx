// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TagDrawer } from "./tag-drawer";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, vars?: Record<string, unknown>) =>
    vars ? `${key}:${JSON.stringify(vars)}` : key,
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

const tags = [
  { id: "search", count: 12, labelEn: "Search", labelZh: "搜索" },
  { id: "stable", count: 8, labelEn: "Stable", labelZh: "稳定" },
  { id: "vision", count: 3, labelEn: "Vision", labelZh: "视觉" },
];

describe("TagDrawer", () => {
  it("renders the toggle collapsed by default when no tags are active", () => {
    render(<TagDrawer tags={tags} />);
    const toggle = screen.getByRole("button", { name: /tagsToggle/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: /search/ })).not.toBeInTheDocument();
  });

  it("renders open and shows the panel when there are active tags", () => {
    mockUseFilters.mockReturnValue({
      filters: { tags: ["stable"] },
      update: mockUpdate,
    });
    render(<TagDrawer tags={tags} />);
    expect(
      screen.getByRole("button", { name: /tagsToggle/ }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: /^stable/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("expands the panel when the toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<TagDrawer tags={tags} />);

    await user.click(screen.getByRole("button", { name: /tagsToggle/ }));

    expect(screen.getByRole("button", { name: /^search/ })).toBeInTheDocument();
  });

  it("dispatches an updated tag list when a tag chip is clicked", async () => {
    mockUseFilters.mockReturnValue({
      filters: { tags: ["stable"] },
      update: mockUpdate,
    });
    const user = userEvent.setup();
    render(<TagDrawer tags={tags} />);

    await user.click(screen.getByRole("button", { name: /^search/ }));

    expect(mockUpdate).toHaveBeenCalledWith({ tags: ["stable", "search"] });
  });

  it("removes a tag from the list when an active chip is clicked", async () => {
    mockUseFilters.mockReturnValue({
      filters: { tags: ["stable", "search"] },
      update: mockUpdate,
    });
    const user = userEvent.setup();
    render(<TagDrawer tags={tags} />);

    await user.click(screen.getByRole("button", { name: /^stable/ }));

    expect(mockUpdate).toHaveBeenCalledWith({ tags: ["search"] });
  });

  it("clears tags when the Clear button is pressed", async () => {
    mockUseFilters.mockReturnValue({
      filters: { tags: ["stable"] },
      update: mockUpdate,
    });
    const user = userEvent.setup();
    render(<TagDrawer tags={tags} />);

    await user.click(screen.getByRole("button", { name: /tags\.clear/ }));

    expect(mockUpdate).toHaveBeenCalledWith({ tags: undefined });
  });

  it("flips the tag-match mode when the all/any toggle is pressed", async () => {
    mockUseFilters.mockReturnValue({
      filters: { tags: ["stable"] },
      update: mockUpdate,
    });
    const user = userEvent.setup();
    render(<TagDrawer tags={tags} />);

    await user.click(screen.getByRole("button", { name: /tags\.all/ }));

    expect(mockUpdate).toHaveBeenCalledWith({ tagMatch: "all" });
  });
});
