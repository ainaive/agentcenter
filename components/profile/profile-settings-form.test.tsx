// @vitest-environment happy-dom
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ProfileSettingsForm } from "./profile-settings-form";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockUpdateProfile = vi.fn();
vi.mock("@/lib/actions/user", () => ({
  updateProfile: (...a: unknown[]) => mockUpdateProfile(...a),
}));

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
});

const baseUser = {
  name: "Jordan Park",
  email: "jordan.park@company.com",
  bio: "Building internal platform tools.",
  defaultDeptId: "eng.cloud.infra",
  joinedLabel: "Apr 2024",
};

describe("ProfileSettingsForm", () => {
  it("prefills the editable fields from the user prop", () => {
    render(<ProfileSettingsForm user={baseUser} />);
    expect(screen.getByLabelText("settings.fields.name")).toHaveValue(
      "Jordan Park",
    );
    expect(screen.getByLabelText("settings.fields.bio")).toHaveValue(
      "Building internal platform tools.",
    );
    expect(screen.getByLabelText("settings.fields.dept")).toHaveValue(
      "eng.cloud.infra",
    );
  });

  it("renders Email and Joined as read-only fields", () => {
    render(<ProfileSettingsForm user={baseUser} />);
    const email = screen.getByLabelText("settings.fields.email");
    expect(email).toHaveValue("jordan.park@company.com");
    expect(email).toBeDisabled();

    const joined = screen.getByLabelText("settings.fields.joined");
    expect(joined).toHaveValue("Apr 2024");
    expect(joined).toBeDisabled();
  });

  it("calls updateProfile with edited values on submit and shows the saved state", async () => {
    mockUpdateProfile.mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(<ProfileSettingsForm user={baseUser} />);
    const name = screen.getByLabelText("settings.fields.name");
    await user.clear(name);
    await user.type(name, "Jordan P.");

    await user.click(screen.getByRole("button", { name: "settings.save" }));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
    });
    expect(mockUpdateProfile).toHaveBeenCalledWith({
      name: "Jordan P.",
      defaultDeptId: "eng.cloud.infra",
      bio: "Building internal platform tools.",
    });

    await waitFor(() => {
      expect(screen.getByText("settings.saved")).toBeInTheDocument();
    });
  });

  it("surfaces an inline error when the action returns invalid_input", async () => {
    mockUpdateProfile.mockResolvedValue({
      ok: false,
      error: "invalid_input",
      detail: "name: Too short",
    });
    const user = userEvent.setup();

    render(<ProfileSettingsForm user={baseUser} />);
    await user.click(screen.getByRole("button", { name: "settings.save" }));

    // The error region uses role="alert" so screen readers announce it.
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /errors\.invalid_input/,
      );
    });
  });
});
