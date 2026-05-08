// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ShareButton } from "./share-button";

afterEach(cleanup);
beforeEach(() => {
  // Force the clipboard fallback path by ensuring navigator.share is absent.
  if ("share" in navigator) {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
  }
});

describe("ShareButton", () => {
  it("renders the provided label", () => {
    render(
      <ShareButton url="https://x" label="Share" copiedLabel="Copied" />,
    );
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
  });

  it("copies the URL and flips the label when Web Share is unavailable", async () => {
    const user = userEvent.setup();
    render(
      <ShareButton
        url="https://example.com/ext/foo"
        label="Share"
        copiedLabel="Copied"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Share" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Copied/ }),
      ).toBeInTheDocument(),
    );
    await expect(navigator.clipboard.readText()).resolves.toBe(
      "https://example.com/ext/foo",
    );
  });
});
