import { afterEach, describe, expect, it, vi } from "vitest";

import {
  classifyDraftError,
  devErrorDetail,
  pgConstraint,
  pgErrorCode,
  pgMessage,
} from "./publish-errors";

// Shape that mirrors a node-postgres DatabaseError: a real Error instance
// with `code` (5-char SQLSTATE), `constraint`, and a descriptive message.
function pgError(opts: {
  code: string;
  constraint?: string;
  message?: string;
}): Error & { code: string; constraint?: string } {
  const err = new Error(opts.message ?? "db error") as Error & {
    code: string;
    constraint?: string;
  };
  err.code = opts.code;
  if (opts.constraint) err.constraint = opts.constraint;
  return err;
}

// Mirrors how Drizzle wraps the underlying DatabaseError: the outer Error's
// message is the SQL that failed, and the real PG error sits at `cause`.
function drizzleWrapped(cause: Error): Error {
  return new Error(
    "Failed query: insert into \"extensions\" ...\nparams: a,b,c",
    { cause },
  );
}

describe("pgErrorCode / pgConstraint / pgMessage", () => {
  it("reads code and constraint from a top-level pg error", () => {
    const err = pgError({
      code: "23505",
      constraint: "extensions_slug_unique",
      message: "duplicate key",
    });
    expect(pgErrorCode(err)).toBe("23505");
    expect(pgConstraint(err)).toBe("extensions_slug_unique");
    expect(pgMessage(err)).toBe("duplicate key");
  });

  // Regression: this is the bug that made every error look like "db_error"
  // after the neon-http -> neon-serverless switch. Drizzle now wraps the
  // pg error, so the helpers must walk `cause`.
  it("unwraps a Drizzle-style wrapper to reach the inner pg error", () => {
    const inner = pgError({
      code: "23503",
      constraint: "extensions_owner_org_id_organizations_id_fk",
      message: 'fk violation on "organizations"',
    });
    const wrapped = drizzleWrapped(inner);

    // The outer error's own message is the SQL — never confuse it with the
    // pg-level message.
    expect(wrapped.message).toContain("Failed query:");

    expect(pgErrorCode(wrapped)).toBe("23503");
    expect(pgConstraint(wrapped)).toBe(
      "extensions_owner_org_id_organizations_id_fk",
    );
    expect(pgMessage(wrapped)).toBe('fk violation on "organizations"');
  });

  it("walks more than one level of cause", () => {
    const inner = pgError({ code: "23502", message: "not null" });
    const mid = new Error("middle wrapper", { cause: inner });
    const outer = new Error("outer wrapper", { cause: mid });

    expect(pgErrorCode(outer)).toBe("23502");
    expect(pgMessage(outer)).toBe("not null");
  });

  it("returns undefined when no pg fields are present anywhere", () => {
    const err = new Error("plain error");
    expect(pgErrorCode(err)).toBeUndefined();
    expect(pgConstraint(err)).toBeUndefined();
    expect(pgMessage(err)).toBeUndefined();
  });

  it("tolerates non-Error values without throwing", () => {
    expect(pgErrorCode("not an object")).toBeUndefined();
    expect(pgErrorCode(null)).toBeUndefined();
    expect(pgErrorCode(undefined)).toBeUndefined();
  });
});

describe("classifyDraftError", () => {
  it("maps unique_violation to slug_taken", () => {
    expect(
      classifyDraftError(
        pgError({ code: "23505", constraint: "extensions_slug_unique" }),
      ),
    ).toBe("slug_taken");
  });

  it("maps fk violations by constraint name", () => {
    expect(
      classifyDraftError(
        pgError({ code: "23503", constraint: "extensions_dept_id_fk" }),
      ),
    ).toBe("invalid_dept");
    expect(
      classifyDraftError(
        pgError({ code: "23503", constraint: "extension_tags_tag_id_fk" }),
      ),
    ).toBe("invalid_tag");
    expect(
      classifyDraftError(
        pgError({ code: "23503", constraint: "extensions_owner_org_id_fk" }),
      ),
    ).toBe("org_missing");
  });

  it("falls back to invalid_reference for an unrecognized fk constraint", () => {
    expect(
      classifyDraftError(
        pgError({ code: "23503", constraint: "extensions_some_other_fk" }),
      ),
    ).toBe("invalid_reference");
  });

  it("maps not_null_violation to missing_required", () => {
    expect(classifyDraftError(pgError({ code: "23502" }))).toBe(
      "missing_required",
    );
  });

  it("returns db_error for unknown codes (e.g. undefined_column)", () => {
    expect(classifyDraftError(pgError({ code: "42703" }))).toBe("db_error");
  });

  it("classifies through a Drizzle wrapper (regression)", () => {
    const inner = pgError({
      code: "23503",
      constraint: "extensions_owner_org_id_organizations_id_fk",
    });
    expect(classifyDraftError(drizzleWrapped(inner))).toBe("org_missing");
  });

  it("returns db_error for plain Error instances", () => {
    expect(classifyDraftError(new Error("nope"))).toBe("db_error");
  });
});

describe("devErrorDetail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns undefined in production so PG details never leak to users", () => {
    vi.stubEnv("NODE_ENV", "production");
    const err = pgError({
      code: "23503",
      constraint: "extensions_dept_id_fk",
      message: "fk violation",
    });
    expect(devErrorDetail(err)).toBeUndefined();
  });

  it("formats code, constraint, and the inner pg message in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const inner = pgError({
      code: "23503",
      constraint: "extensions_owner_org_id_organizations_id_fk",
      message: 'fk violation on "organizations"',
    });
    const detail = devErrorDetail(drizzleWrapped(inner));
    expect(detail).toContain("pg=23503");
    expect(detail).toContain(
      "constraint=extensions_owner_org_id_organizations_id_fk",
    );
    expect(detail).toContain('fk violation on "organizations"');
    // Should not surface Drizzle's outer "Failed query: ..." wrapper text
    // when an inner pg message is available.
    expect(detail).not.toContain("Failed query:");
  });

  it("falls back to the outer Error message if nothing has a pg code", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(devErrorDetail(new Error("connection refused"))).toBe(
      "connection refused",
    );
  });
});
