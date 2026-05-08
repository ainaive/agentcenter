// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { InstallCommand } from "./install-command";

afterEach(cleanup);

describe("InstallCommand", () => {
  it("renders the command with a $ prompt", () => {
    render(
      <InstallCommand
        command="agentcenter install foo"
        copyLabel="Copy"
        copiedLabel="Copied"
      />,
    );
    expect(screen.getByText("agentcenter install foo")).toBeInTheDocument();
    expect(screen.getByText("$")).toBeInTheDocument();
  });

  it("copies the command and flips the button label after click", async () => {
    const user = userEvent.setup();
    render(
      <InstallCommand
        command="agentcenter install foo"
        copyLabel="Copy"
        copiedLabel="Copied"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Copied/ }),
      ).toBeInTheDocument(),
    );
    await expect(navigator.clipboard.readText()).resolves.toBe(
      "agentcenter install foo",
    );
  });
});
