// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BasicsStep, slugFromName } from "./basics";
import type { ManifestFormValues } from "@/lib/validators/manifest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

afterEach(cleanup);

const empty: ManifestFormValues = {
  slug: "",
  name: "",
  nameZh: "",
  version: "1.0.0",
  category: "skills",
  scope: "personal",
  summary: "",
  taglineZh: "",
  readmeMd: "",
  iconColor: "indigo",
  tagIds: [],
  deptId: "",
  permissions: {},
  sourceMethod: "zip",
};

describe("slugFromName", () => {
  it("lowercases, hyphenates, and trims", () => {
    expect(slugFromName("My Cool Extension")).toBe("my-cool-extension");
  });

  it("collapses non-alphanumerics into single hyphens", () => {
    expect(slugFromName("Hello   world!!  ")).toBe("hello-world");
  });

  it("caps at 40 chars", () => {
    expect(slugFromName("a".repeat(60))).toHaveLength(40);
  });
});

describe("BasicsStep slug auto-derivation", () => {
  function setup(initial: Partial<ManifestFormValues> = {}) {
    let draft: ManifestFormValues = { ...empty, ...initial };
    const patch = vi.fn((p: Partial<ManifestFormValues>) => {
      draft = { ...draft, ...p };
    });
    const view = render(<BasicsStep draft={draft} patch={patch} />);
    const rerender = (next: Partial<ManifestFormValues>) => {
      draft = { ...draft, ...next };
      view.rerender(<BasicsStep draft={draft} patch={patch} />);
    };
    return { patch, rerender, getDraft: () => draft };
  }

  it("derives slug from name when slug is empty", async () => {
    const user = userEvent.setup();
    const { patch } = setup();

    await user.type(screen.getByPlaceholderText("namePlaceholder"), "X");
    // First keystroke fires patch({ name: "X", slug: "x" }).
    expect(patch).toHaveBeenCalledWith(
      expect.objectContaining({ name: "X", slug: "x" }),
    );
  });

  it("does NOT overwrite a user-edited slug", async () => {
    const user = userEvent.setup();
    const { patch } = setup({ name: "old-name", slug: "custom-slug" });
    // The slug "custom-slug" doesn't match slugFromName("old-name"),
    // so editing the name should leave the slug alone.
    const nameInput = screen.getByPlaceholderText("namePlaceholder");
    await user.type(nameInput, "X");
    const lastCall = patch.mock.calls.at(-1)?.[0];
    expect(lastCall).toBeDefined();
    expect(lastCall).not.toHaveProperty("slug");
  });
});

describe("BasicsStep ZH translation toggle", () => {
  it("hides nameZh input by default and reveals it on click", async () => {
    const user = userEvent.setup();
    render(<BasicsStep draft={empty} patch={vi.fn()} />);
    expect(screen.queryByPlaceholderText("例如：网页搜索 Pro")).toBeNull();
    await user.click(screen.getByRole("button", { name: /zhToggle/ }));
    expect(
      screen.getByPlaceholderText("例如：网页搜索 Pro"),
    ).toBeInTheDocument();
  });

  it("starts open when nameZh or taglineZh already has a value", () => {
    render(
      <BasicsStep draft={{ ...empty, nameZh: "中文名" }} patch={vi.fn()} />,
    );
    expect(
      screen.getByPlaceholderText("例如：网页搜索 Pro"),
    ).toBeInTheDocument();
  });
});
