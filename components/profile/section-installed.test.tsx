// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { SectionInstalled } from "./section-installed";

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

describe("SectionInstalled", () => {
  it("renders the empty state with a Browse CTA when nothing is installed", () => {
    render(<SectionInstalled rows={[]} />);
    expect(screen.getByText("emptyInstalled.title")).toBeInTheDocument();
    const browse = screen.getByRole("link", { name: /browse/ });
    expect(browse).toHaveAttribute("href", "/extensions");
  });

  it("renders one row per active install with name and installed version", () => {
    render(
      <SectionInstalled
        rows={[
          {
            extensionId: "ext-1",
            slug: "my-skill",
            name: "My Skill",
            category: "skills",
            iconColor: "indigo",
            installedVersion: "1.2.0",
            installedAt: new Date("2025-12-01T00:00:00Z"),
          },
          {
            extensionId: "ext-2",
            slug: "tool",
            name: "Tool",
            category: "mcp",
            iconColor: null,
            installedVersion: "0.1.3",
            installedAt: new Date("2025-11-01T00:00:00Z"),
          },
        ]}
      />,
    );

    expect(screen.getByText("My Skill")).toBeInTheDocument();
    expect(screen.getByText("Tool")).toBeInTheDocument();
    // Installed version surfaces inline so the user can see what's running.
    expect(screen.getByText(/1\.2\.0/)).toBeInTheDocument();
    expect(screen.getByText(/0\.1\.3/)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /My Skill/ });
    expect(link).toHaveAttribute("href", "/extensions/my-skill");
  });
});
