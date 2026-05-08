// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ManifestForm } from "./manifest-form";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

afterEach(cleanup);

const VALID_DEFAULTS = {
  slug: "my-skill",
  name: "My Skill",
  subCat: "search",
  description: "Does things.",
};

describe("ManifestForm", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it("renders the form with slug placeholder and default version", () => {
    render(<ManifestForm onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText("my-extension")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1.0.0")).toBeInTheDocument();
  });

  it("shows Required errors on submit when slug, name, subCat, and description are empty", async () => {
    const onSubmit = vi.fn();
    render(<ManifestForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "nextButton" }));

    const errors = await screen.findAllByText("Required");
    expect(errors).toHaveLength(4); // slug, name, subCat, description
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a slug format error for a slug that fails the regex", async () => {
    render(<ManifestForm onSubmit={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("my-extension"), "Invalid Slug!");
    await user.click(screen.getByRole("button", { name: "nextButton" }));

    // t("slug") returns the key "slug" — that is the error message the component sets
    await waitFor(() => expect(screen.getByText("slug")).toBeInTheDocument());
  });

  it("calls onSubmit with the form values when all required fields are valid", async () => {
    const onSubmit = vi.fn();
    render(<ManifestForm onSubmit={onSubmit} defaultValues={VALID_DEFAULTS} />);

    await user.click(screen.getByRole("button", { name: "nextButton" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "my-skill",
        name: "My Skill",
        subCat: "search",
        version: "1.0.0",
        category: "skills",
      }),
    );
  });

  it("adds a tag when its button is clicked", async () => {
    render(<ManifestForm onSubmit={vi.fn()} />);

    const searchTag = screen.getByRole("button", { name: "search" });
    expect(searchTag.className).not.toContain("bg-primary");

    await user.click(searchTag);
    expect(searchTag.className).toContain("bg-primary");
  });

  it("removes a tag when clicked a second time", async () => {
    render(<ManifestForm onSubmit={vi.fn()} />);

    const searchTag = screen.getByRole("button", { name: "search" });
    await user.click(searchTag);
    await user.click(searchTag);

    expect(searchTag.className).not.toContain("bg-primary");
  });

  it("does not add a 9th tag when 8 are already selected", async () => {
    render(<ManifestForm onSubmit={vi.fn()} />);

    // Click the first 9 tag buttons (all are type="button")
    const tagBtns = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("type") === "button");

    for (const btn of tagBtns.slice(0, 9)) {
      await user.click(btn);
    }

    const selected = tagBtns.filter((b) => b.className.includes("bg-primary"));
    expect(selected).toHaveLength(8);
  });

  it("pre-populates fields from defaultValues", () => {
    render(<ManifestForm onSubmit={vi.fn()} defaultValues={{ slug: "pre-filled", version: "2.0.0" }} />);

    expect(screen.getByDisplayValue("pre-filled")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2.0.0")).toBeInTheDocument();
  });
});
