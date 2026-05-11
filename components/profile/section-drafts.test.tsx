// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { SectionDrafts } from "./section-drafts";

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

describe("SectionDrafts", () => {
  it("renders the empty state with a New extension CTA when there are no drafts", () => {
    render(<SectionDrafts rows={[]} />);
    expect(screen.getByText("emptyDrafts.title")).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /publishOne/ });
    expect(cta).toHaveAttribute("href", "/publish/new");
  });

  it("renders a Continue link per draft pointing to the resume page", () => {
    render(
      <SectionDrafts
        rows={[
          {
            extensionId: "ext-d1",
            slug: "wip-skill",
            name: "WIP Skill",
            category: "skills",
            iconColor: null,
            updatedAt: new Date("2025-12-01T00:00:00Z"),
            latestStatus: "pending",
          },
        ]}
      />,
    );

    expect(screen.getByText("WIP Skill")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /WIP Skill/ });
    // Resume link goes to the wizard, mirroring app/[locale]/publish/page.tsx.
    expect(link).toHaveAttribute("href", "/publish/ext-d1/edit");
  });
});
