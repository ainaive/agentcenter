// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { LivePreview } from "./live-preview";
import type { ManifestFormValues } from "@/lib/validators/manifest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

afterEach(cleanup);

const baseDraft: ManifestFormValues = {
  slug: "my-skill",
  name: "My Skill",
  nameZh: "",
  version: "1.0.0",
  category: "skills",
  scope: "personal",
  summary: "Real-time search",
  taglineZh: "",
  readmeMd: "",
  iconColor: "indigo",
  tagIds: ["search", "ai"],
  deptId: "",
  permissions: { network: true },
  sourceMethod: "zip",
};

describe("LivePreview", () => {
  it("shows the draft name, summary, and tag chips", () => {
    render(<LivePreview draft={baseDraft} />);
    expect(screen.getByText("My Skill")).toBeInTheDocument();
    expect(screen.getByText("Real-time search")).toBeInTheDocument();
    expect(screen.getByText("search")).toBeInTheDocument();
    expect(screen.getByText("ai")).toBeInTheDocument();
  });

  it("renders manifest JSON with derived shape", () => {
    render(<LivePreview draft={baseDraft} />);
    // Manifest preview is a <pre> blob — find the node and parse it.
    const pre = document.querySelector("pre");
    expect(pre).not.toBeNull();
    const manifest = JSON.parse(pre!.textContent ?? "{}");
    expect(manifest).toMatchObject({
      name: "my-skill",
      displayName: "My Skill",
      type: "skills",
      version: "1.0.0",
      scope: "personal",
      tags: ["search", "ai"],
      permissions: ["network"],
    });
  });

  it("renders only enabled permissions in the manifest", () => {
    render(
      <LivePreview
        draft={{
          ...baseDraft,
          permissions: { network: true, files: false, runtime: true },
        }}
      />,
    );
    const pre = document.querySelector("pre");
    const manifest = JSON.parse(pre!.textContent ?? "{}");
    expect(manifest.permissions).toEqual(["network", "runtime"]);
  });

  it("falls back to placeholder name + summary when draft is empty", () => {
    render(
      <LivePreview
        draft={{ ...baseDraft, name: "", summary: "", tagIds: [] }}
      />,
    );
    expect(screen.getByText("placeholderName")).toBeInTheDocument();
    expect(screen.getByText("placeholderSummary")).toBeInTheDocument();
  });
});
