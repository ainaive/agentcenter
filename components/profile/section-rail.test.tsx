// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";

import { SectionRail, PROFILE_SECTIONS } from "./section-rail";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string | { pathname: string; query?: Record<string, string> };
    children: React.ReactNode;
  } & React.HTMLAttributes<HTMLAnchorElement>) => {
    // Match next-intl's Link's two-arg shape so the test asserts what we
    // actually emit (locale-aware Link, with `query` rather than a raw search
    // string). We render to a plain <a> with a synthesized href so the
    // assertion below can read it.
    const synth =
      typeof href === "string"
        ? href
        : `${href.pathname}${
            href.query
              ? "?" +
                new URLSearchParams(
                  href.query as Record<string, string>,
                ).toString()
              : ""
          }`;
    return (
      <a href={synth} {...rest}>
        {children}
      </a>
    );
  },
}));

afterEach(cleanup);

describe("SectionRail", () => {
  it("exports the canonical list of 6 section keys", () => {
    expect(PROFILE_SECTIONS).toEqual([
      "installed",
      "published",
      "drafts",
      "saved",
      "activity",
      "settings",
    ]);
  });

  it("renders one link per section, each linking to /profile?section=<key>", () => {
    render(<SectionRail activeKey="installed" />);
    const nav = screen.getByRole("navigation");
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(6);
    for (const key of PROFILE_SECTIONS) {
      const link = within(nav).getByRole("link", {
        name: new RegExp(`sections\\.${key}`),
      });
      expect(link.getAttribute("href")).toBe(`/profile?section=${key}`);
    }
  });

  it("marks only the active section with aria-current=page", () => {
    render(<SectionRail activeKey="settings" />);
    const active = screen.getByRole("link", {
      name: /sections\.settings/,
    });
    expect(active).toHaveAttribute("aria-current", "page");
    // None of the others should carry aria-current.
    for (const key of PROFILE_SECTIONS) {
      if (key === "settings") continue;
      const link = screen.getByRole("link", {
        name: new RegExp(`sections\\.${key}`),
      });
      expect(link).not.toHaveAttribute("aria-current");
    }
  });
});
