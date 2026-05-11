// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { ProfileHero } from "./profile-hero";

// Echo the translation key so assertions can look for it directly.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

afterEach(cleanup);

describe("ProfileHero", () => {
  const base = {
    name: "Alice Bob",
    email: "alice@example.com",
    joinedLabel: "Joined Apr 2024",
    deptLabel: "Cloud Platform · Engineering",
  };

  it("renders the display name and initials from name", () => {
    render(<ProfileHero {...base} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Alice Bob",
    );
    // The avatar is decorative — initials are visual only, but we still want
    // them present so the visual matches the design.
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("falls back to first email letter when name is null", () => {
    render(<ProfileHero {...base} name={null} />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  // Empty string is a real shape we'll see in the DB (the column is nullable
  // and better-auth sometimes round-trips `""` rather than null) — initials
  // must not crash on it.
  it("falls back to first email letter when name is empty", () => {
    render(<ProfileHero {...base} name="" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("collapses consecutive spaces in name before extracting initials", () => {
    render(<ProfileHero {...base} name="Alice  Bob  Carter" />);
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("renders a single initial for a single-token name", () => {
    render(<ProfileHero {...base} name="Q" />);
    // The h1 also renders "Q" when the name is one letter; scope to the
    // avatar div so the assertion isn't ambiguous.
    expect(screen.getByText("Q", { selector: "div" })).toBeInTheDocument();
  });

  it("renders the (static) role label, the resolved dept label, and the joined label", () => {
    render(<ProfileHero {...base} />);
    // Role is a static i18n key — the echo-mock surfaces "role".
    expect(screen.getByText("role")).toBeInTheDocument();
    expect(
      screen.getByText("Cloud Platform · Engineering"),
    ).toBeInTheDocument();
    expect(screen.getByText("Joined Apr 2024")).toBeInTheDocument();
  });

  it("renders the deptUnset placeholder when deptLabel is null", () => {
    render(<ProfileHero {...base} deptLabel={null} />);
    expect(screen.getByText("deptUnset")).toBeInTheDocument();
  });
});
