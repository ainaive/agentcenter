// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ListingStep } from "./listing";
import type { ManifestFormValues } from "@/lib/validators/manifest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

afterEach(cleanup);

const empty: ManifestFormValues = {
  slug: "my-skill",
  name: "My Skill",
  nameZh: "",
  version: "1.0.0",
  category: "skills",
  scope: "personal",
  summary: "x",
  taglineZh: "",
  readmeMd: "",
  iconColor: "indigo",
  tagIds: [],
  deptId: "",
  permissions: {},
  sourceMethod: "zip",
};

function setup(initial: Partial<ManifestFormValues> = {}) {
  let draft: ManifestFormValues = { ...empty, ...initial };
  const patch = vi.fn((p: Partial<ManifestFormValues>) => {
    draft = { ...draft, ...p };
  });
  const view = render(
    <ListingStep draft={draft} patch={patch} locale="en" />,
  );
  const rerender = (next: Partial<ManifestFormValues>) => {
    draft = { ...draft, ...next };
    view.rerender(<ListingStep draft={draft} patch={patch} locale="en" />);
  };
  return { patch, rerender, getDraft: () => draft };
}

describe("ListingStep tags", () => {
  it("adds a tag on Enter and clears the input", async () => {
    const user = userEvent.setup();
    const { patch } = setup();
    const input = screen.getByPlaceholderText("tagsPlaceholder");
    await user.type(input, "search{enter}");
    expect(patch).toHaveBeenCalledWith({ tagIds: ["search"] });
  });

  it("removes the trailing tag on Backspace when input is empty", async () => {
    const user = userEvent.setup();
    const { patch } = setup({ tagIds: ["a", "b"] });
    const input = screen.getByPlaceholderText("tagsPlaceholder");
    input.focus();
    await user.keyboard("{Backspace}");
    expect(patch).toHaveBeenCalledWith({ tagIds: ["a"] });
  });

  it("adds a suggested tag when its chip is clicked", async () => {
    const user = userEvent.setup();
    const { patch } = setup();
    await user.click(screen.getByRole("button", { name: "+ stable" }));
    expect(patch).toHaveBeenCalledWith({ tagIds: ["stable"] });
  });

  it("ignores duplicate tag adds", async () => {
    const user = userEvent.setup();
    const { patch } = setup({ tagIds: ["search"] });
    const input = screen.getByPlaceholderText("tagsPlaceholder");
    await user.type(input, "search{enter}");
    expect(patch).not.toHaveBeenCalled();
  });
});

describe("ListingStep permissions", () => {
  it("toggles a permission on click", async () => {
    const user = userEvent.setup();
    const { patch } = setup();
    await user.click(screen.getByRole("button", { name: "network" }));
    expect(patch).toHaveBeenCalledWith({ permissions: { network: true } });
  });

  it("flips a permission off when already on", async () => {
    const user = userEvent.setup();
    const { patch } = setup({
      permissions: { network: true, files: true },
    });
    await user.click(screen.getByRole("button", { name: "network" }));
    expect(patch).toHaveBeenCalledWith({
      permissions: { network: false, files: true },
    });
  });
});
