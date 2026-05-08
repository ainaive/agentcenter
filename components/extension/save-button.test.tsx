// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SaveButton } from "./save-button";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockPush = vi.fn();
vi.mock("@/lib/i18n/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

vi.mock("@/lib/actions/collections", () => ({
  saveExtension: vi.fn(),
}));

import { saveExtension } from "@/lib/actions/collections";

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
});

describe("SaveButton", () => {
  it("renders a button with an aria-label for adding to group", () => {
    render(<SaveButton extensionId="ext-1" />);
    expect(screen.getByRole("button", { name: "addToGroup" })).toBeInTheDocument();
  });

  it("calls saveExtension with the extensionId when clicked", async () => {
    vi.mocked(saveExtension).mockResolvedValue({ ok: true, alreadySaved: false });
    const user = userEvent.setup();

    render(<SaveButton extensionId="ext-99" />);
    await user.click(screen.getByRole("button", { name: "addToGroup" }));

    await waitFor(() => expect(saveExtension).toHaveBeenCalledWith("ext-99"));
  });

  it("shows 'saved' aria-label after a successful save", async () => {
    vi.mocked(saveExtension).mockResolvedValue({ ok: true, alreadySaved: false });
    const user = userEvent.setup();

    render(<SaveButton extensionId="ext-1" />);
    await user.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "saved" })).toBeInTheDocument(),
    );
  });

  it("redirects to /sign-in when the user is unauthenticated", async () => {
    vi.mocked(saveExtension).mockResolvedValue({ ok: false, error: "unauthenticated" });
    const user = userEvent.setup();

    render(<SaveButton extensionId="ext-1" />);
    await user.click(screen.getByRole("button", { name: "addToGroup" }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/sign-in"));
  });

  describe("pill variant", () => {
    it("renders the label text alongside the icon", () => {
      render(<SaveButton extensionId="ext-1" variant="pill" />);
      expect(
        screen.getByRole("button", { name: /addToGroup/ }),
      ).toHaveTextContent("addToGroup");
    });

    it("flips the label to 'saved' after a successful save", async () => {
      vi.mocked(saveExtension).mockResolvedValue({
        ok: true,
        alreadySaved: false,
      });
      const user = userEvent.setup();

      render(<SaveButton extensionId="ext-1" variant="pill" />);
      await user.click(screen.getByRole("button"));

      await waitFor(() =>
        expect(screen.getByRole("button")).toHaveTextContent("saved"),
      );
    });
  });
});
