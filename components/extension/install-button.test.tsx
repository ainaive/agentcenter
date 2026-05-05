// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { InstallButton } from "./install-button";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockPush = vi.fn();
vi.mock("@/lib/i18n/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

vi.mock("@/lib/actions/install", () => ({
  installExtension: vi.fn(),
}));

import { installExtension } from "@/lib/actions/install";

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
});

describe("InstallButton", () => {
  it("renders with install label by default", () => {
    render(<InstallButton extensionId="ext-1" />);
    expect(screen.getByRole("button", { name: /install/ })).toBeInTheDocument();
  });

  it("calls installExtension with the extensionId when clicked", async () => {
    vi.mocked(installExtension).mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(<InstallButton extensionId="ext-42" />);
    await user.click(screen.getByRole("button", { name: /install/ }));

    await waitFor(() => expect(installExtension).toHaveBeenCalledWith("ext-42"));
  });

  it("shows 'installed' label after a successful install", async () => {
    vi.mocked(installExtension).mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(<InstallButton extensionId="ext-1" />);
    await user.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /installed/ })).toBeInTheDocument(),
    );
  });

  it("redirects to /sign-in when the user is unauthenticated", async () => {
    vi.mocked(installExtension).mockResolvedValue({ ok: false, error: "unauthenticated" });
    const user = userEvent.setup();

    render(<InstallButton extensionId="ext-1" />);
    await user.click(screen.getByRole("button", { name: /install/ }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/sign-in"));
  });

  it("renders the large size variant", () => {
    render(<InstallButton extensionId="ext-1" size="lg" />);
    const btn = screen.getByRole("button", { name: /install/ });
    expect(btn.className).toContain("px-4");
  });
});
