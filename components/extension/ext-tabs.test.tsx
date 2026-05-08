// @vitest-environment happy-dom
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ExtTabs } from "./ext-tabs";

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

const tabs = [
  { key: "overview", label: "Overview", content: <div>overview body</div> },
  { key: "setup", label: "Setup", content: <div>setup body</div> },
];

describe("ExtTabs", () => {
  it("renders the first tab's content by default", () => {
    render(<ExtTabs tabs={tabs} />);
    expect(screen.getByText("overview body")).toBeInTheDocument();
    expect(screen.queryByText("setup body")).not.toBeInTheDocument();
  });

  it("swaps the visible panel when another tab is clicked", async () => {
    const user = userEvent.setup();
    render(<ExtTabs tabs={tabs} />);

    await user.click(screen.getByRole("tab", { name: "Setup" }));

    expect(screen.getByText("setup body")).toBeInTheDocument();
    expect(screen.queryByText("overview body")).not.toBeInTheDocument();
  });

  it("respects defaultTab when provided", () => {
    render(<ExtTabs tabs={tabs} defaultTab="setup" />);
    expect(screen.getByText("setup body")).toBeInTheDocument();
    expect(screen.queryByText("overview body")).not.toBeInTheDocument();
  });

  it("emits proper ARIA wiring for assistive tech", () => {
    render(<ExtTabs tabs={tabs} />);

    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveAttribute("data-orientation", "horizontal");

    const overview = screen.getByRole("tab", { name: "Overview" });
    expect(overview).toHaveAttribute("aria-selected", "true");
    expect(overview).toHaveAttribute("aria-controls");
  });
});
