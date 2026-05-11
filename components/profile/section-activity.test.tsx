// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { SectionActivity } from "./section-activity";
import type { ProfileActivityEvent } from "@/lib/db/queries/profile";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & React.HTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

describe("SectionActivity", () => {
  it("renders the empty state when there is no activity", () => {
    render(<SectionActivity events={[]} />);
    expect(screen.getByText("emptyActivity.title")).toBeInTheDocument();
  });

  it("renders one row per event with kind, extension name, and link", () => {
    const events: ProfileActivityEvent[] = [
      {
        kind: "installed",
        at: new Date("2025-12-10T00:00:00Z"),
        extensionId: "ext-1",
        slug: "skill-a",
        name: "Skill A",
        version: "1.0.0",
      },
      {
        kind: "published",
        at: new Date("2025-12-08T00:00:00Z"),
        extensionId: "ext-2",
        slug: "mine",
        name: "Mine",
        version: "2.1.0",
      },
      {
        kind: "rated",
        at: new Date("2025-12-05T00:00:00Z"),
        extensionId: "ext-3",
        slug: "other",
        name: "Other",
        stars: 4,
      },
    ];

    render(<SectionActivity events={events} />);

    // Each event surfaces the extension name + a verb keyed by kind.
    expect(screen.getByText("Skill A")).toBeInTheDocument();
    expect(screen.getByText("Mine")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
    expect(screen.getByText(/activity\.installed/)).toBeInTheDocument();
    expect(screen.getByText(/activity\.published/)).toBeInTheDocument();
    expect(screen.getByText(/activity\.rated/)).toBeInTheDocument();

    // The rated row carries the star count inline.
    expect(screen.getByText(/★/)).toBeInTheDocument();

    // Each row links to the extension's detail page.
    expect(screen.getByRole("link", { name: /Skill A/ })).toHaveAttribute(
      "href",
      "/extensions/skill-a",
    );
  });
});
