// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UserButton } from "./user-button";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("@/lib/i18n/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockUseSession = vi.fn();
const mockSignOut = vi.fn();
vi.mock("@/lib/auth/client", () => ({
  authClient: {
    useSession: () => mockUseSession(),
    signOut: () => mockSignOut(),
  },
}));

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
});

describe("UserButton", () => {
  it("renders a Sign in link when there is no session", () => {
    mockUseSession.mockReturnValue({ data: null });

    render(<UserButton />);

    const link = screen.getByRole("link", { name: "signIn" });
    expect(link).toHaveAttribute("href", "/sign-in");
  });

  it("renders an avatar with name initials when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Alice Bob", email: "alice@example.com" } },
    });

    render(<UserButton />);

    // Accessible name comes from aria-label; the initials are visual only.
    const button = screen.getByRole("button", { name: "userMenu" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("AB");
  });

  it("falls back to the first email letter when name is missing", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: null, email: "zoe@example.com" } },
    });

    render(<UserButton />);

    expect(
      screen.getByRole("button", { name: "userMenu" }),
    ).toHaveTextContent("Z");
  });

  it("opens the dropdown and shows email + sign out on avatar click", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Alice Bob", email: "alice@example.com" } },
    });
    const user = userEvent.setup();

    render(<UserButton />);
    await user.click(screen.getByRole("button", { name: "userMenu" }));

    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /signOut/ })).toBeInTheDocument();
  });

  it("calls signOut and navigates home when the sign-out item is clicked", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Alice Bob", email: "alice@example.com" } },
    });
    mockSignOut.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<UserButton />);
    await user.click(screen.getByRole("button", { name: "userMenu" }));
    await user.click(screen.getByRole("button", { name: /signOut/ }));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledOnce());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("exposes haspopup + expanded state on the avatar button", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Alice Bob", email: "alice@example.com" } },
    });
    const user = userEvent.setup();

    render(<UserButton />);
    const button = screen.getByRole("button", { name: "userMenu" });
    expect(button).toHaveAttribute("aria-haspopup", "menu");
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });
});
