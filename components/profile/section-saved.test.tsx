// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { SectionSaved } from "./section-saved";

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

describe("SectionSaved", () => {
  it("renders the empty state with a Browse CTA when nothing is saved", () => {
    render(<SectionSaved rows={[]} />);
    expect(screen.getByText("emptySaved.title")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /browse/ }),
    ).toHaveAttribute("href", "/extensions");
  });

  it("renders one row per saved extension linking to the detail page", () => {
    render(
      <SectionSaved
        rows={[
          {
            extensionId: "ext-s1",
            slug: "bookmarked",
            name: "Bookmarked",
            category: "skills",
            iconColor: null,
            savedAt: new Date("2025-12-01T00:00:00Z"),
          },
        ]}
      />,
    );

    expect(screen.getByText("Bookmarked")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Bookmarked/ }),
    ).toHaveAttribute("href", "/extensions/bookmarked");
  });
});
