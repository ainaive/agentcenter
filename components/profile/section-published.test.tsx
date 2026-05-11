// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { SectionPublished } from "./section-published";

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

describe("SectionPublished", () => {
  it("renders the empty state with a Publish CTA when the list is empty", () => {
    render(<SectionPublished rows={[]} />);
    expect(screen.getByText("emptyPublished.title")).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /publishOne/ });
    expect(cta).toHaveAttribute("href", "/publish/new");
  });

  it("renders one row per published extension with version + install count", () => {
    render(
      <SectionPublished
        rows={[
          {
            extensionId: "ext-1",
            slug: "my-skill",
            name: "My Skill",
            category: "skills",
            iconColor: "indigo",
            latestVersion: "1.2.0",
            downloadsCount: 1234,
            starsAvg: "4.5",
            ratingsCount: 12,
          },
          {
            extensionId: "ext-2",
            slug: "other",
            name: "Other",
            category: "mcp",
            iconColor: null,
            latestVersion: null,
            downloadsCount: 0,
            starsAvg: "0.0",
            ratingsCount: 0,
          },
        ]}
      />,
    );

    // Row 1: name, version, install count visible
    expect(screen.getByText("My Skill")).toBeInTheDocument();
    expect(screen.getByText(/1\.2\.0/)).toBeInTheDocument();
    expect(screen.getByText(/1,234/)).toBeInTheDocument();
    // ★4.5 rendered when ratingsCount > 0
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();

    // Row 2: no version, no rating — renders without crashing
    expect(screen.getByText("Other")).toBeInTheDocument();

    // Each row links to the public detail page.
    const link1 = screen.getByRole("link", { name: /My Skill/ });
    expect(link1).toHaveAttribute("href", "/extensions/my-skill");
  });
});
