import { describe, expect, it } from "vitest";

import { isResumable, rowAction } from "./row-action";

describe("rowAction", () => {
  it("routes pending without bundle to resume_upload (lands on Step 2)", () => {
    expect(rowAction("pending", false)).toBe("resume_upload");
  });

  it("routes pending with bundle to resume_submit (lands on Step 3)", () => {
    expect(rowAction("pending", true)).toBe("resume_submit");
  });

  it("maps scanning / ready / rejected to their own non-clickable rows", () => {
    expect(rowAction("scanning", true)).toBe("scanning");
    expect(rowAction("ready", true)).toBe("ready");
    expect(rowAction("rejected", true)).toBe("rejected");
  });

  it("treats null status (e.g. orphan extension with no versions) as 'none'", () => {
    expect(rowAction(null, false)).toBe("none");
  });

  it("treats unknown future statuses as 'none' rather than crashing", () => {
    expect(rowAction("archived_internally" as string, true)).toBe("none");
  });
});

describe("isResumable", () => {
  it("only the two resume_* actions are resumable", () => {
    expect(isResumable("resume_upload")).toBe(true);
    expect(isResumable("resume_submit")).toBe(true);
    expect(isResumable("scanning")).toBe(false);
    expect(isResumable("ready")).toBe(false);
    expect(isResumable("rejected")).toBe(false);
    expect(isResumable("none")).toBe(false);
  });
});
