// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

// `Link` is the only thing the wizard imports from the i18n navigation
// module — stub it as a passthrough <a> so render doesn't trip on the
// next-intl routing wrapper in tests.
vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/actions/publish", () => ({
  createDraftExtension: vi.fn(),
  updateDraftExtension: vi.fn(),
  submitForReview: vi.fn(),
  // attachFile is imported transitively by SourceStep, which the wizard
  // imports. Stub it so module evaluation doesn't crash even though we
  // never reach Step 2 in these tests.
  attachFile: vi.fn(),
}));

import { UploadWizard } from "./index";
import {
  createDraftExtension,
  updateDraftExtension,
} from "@/lib/actions/publish";

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
});

describe("UploadWizard saveDraft gate", () => {
  // CodeRabbit-A1 regression. The original implementation always
  // redirected to the dashboard on Save Draft, even when there was
  // nothing to save — the user's in-memory edits silently disappeared.
  // The fix gates redirect on (extensionId || stepsValid[0]) and
  // disables the button accordingly. This pins both behaviors.
  it("disables Save Draft and is a no-op when nothing has been persisted", async () => {
    const user = userEvent.setup();
    render(<UploadWizard />);

    const button = screen.getByRole("button", { name: "saveDraft" });
    expect(button).toBeDisabled();

    await user.click(button);

    expect(mockPush).not.toHaveBeenCalled();
    expect(vi.mocked(createDraftExtension)).not.toHaveBeenCalled();
    expect(vi.mocked(updateDraftExtension)).not.toHaveBeenCalled();
  });

  it("re-enables Save Draft once a resumed draft is loaded, even if Basics is blank", () => {
    // The OR side of the gate: an existing extensionId from resume mode
    // means there's something on the server to update, regardless of
    // whether the in-memory Basics fields would pass stepsValid[0].
    render(
      <UploadWizard
        resume={{
          extensionId: "ext-1",
          versionId: "v-1",
          slug: "my-skill",
          version: "1.0.0",
          name: "My Skill",
          category: "skills",
          scope: "personal",
          bundleUploaded: false,
          formValues: {
            slug: "my-skill",
            name: "My Skill",
            nameZh: "",
            // Deliberately blank summary so stepsValid[0] would be false
            // — only the extensionId guard should be holding the button open.
            summary: "",
            taglineZh: "",
            version: "1.0.0",
            category: "skills",
            scope: "personal",
            tagIds: [],
            deptId: "",
            readmeMd: "",
            iconColor: "indigo",
            permissions: {},
            sourceMethod: "zip",
          },
        }}
      />,
    );

    const button = screen.getByRole("button", { name: "saveDraft" });
    expect(button).not.toBeDisabled();
  });
});
