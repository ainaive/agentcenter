// Pure helpers for decoding the errors thrown by Drizzle / node-postgres
// when the publish-wizard server actions write to the database.
//
// Drizzle wraps the underlying `DatabaseError` so `err.message` is the
// SQL that failed and the real `code` / `constraint` / message live on
// `err.cause`. Anything that classifies these errors must walk that chain.

// Walk the `cause` chain looking for a property that matches the predicate.
// Capped at 5 levels to short-circuit accidental cycles.
function findInCauseChain<T>(
  err: unknown,
  pick: (e: object) => T | undefined,
): T | undefined {
  let current: unknown = err;
  for (let i = 0; i < 5 && current && typeof current === "object"; i++) {
    const got = pick(current);
    if (got !== undefined) return got;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}

// Postgres error code, e.g. "23503" (foreign_key_violation). Set by
// node-postgres on `DatabaseError` instances.
export function pgErrorCode(err: unknown): string | undefined {
  return findInCauseChain(err, (e) => {
    if ("code" in e && typeof (e as { code: unknown }).code === "string") {
      return (e as { code: string }).code;
    }
    return undefined;
  });
}

export function pgConstraint(err: unknown): string | undefined {
  return findInCauseChain(err, (e) => {
    if (
      "constraint" in e &&
      typeof (e as { constraint: unknown }).constraint === "string"
    ) {
      return (e as { constraint: string }).constraint;
    }
    return undefined;
  });
}

// The underlying PG message (e.g. 'insert or update on table "extensions"
// violates foreign key constraint ...'), not Drizzle's wrapper which is
// just the SQL.
export function pgMessage(err: unknown): string | undefined {
  return findInCauseChain(err, (e) => {
    if ("code" in e && e instanceof Error) return e.message;
    return undefined;
  });
}

// Map a thrown DB error to a stable error code the UI can translate.
// Codes are strings (not enums) so adding new ones doesn't require a type
// migration. Keep in sync with `publish.errors.*` in messages/{en,zh}.json.
export function classifyDraftError(err: unknown): string {
  const code = pgErrorCode(err);
  const constraint = pgConstraint(err);
  if (code === "23505") return "slug_taken"; // unique_violation
  if (code === "23503") {
    // foreign_key_violation: figure out which FK failed
    if (constraint?.includes("dept")) return "invalid_dept";
    if (constraint?.includes("tag")) return "invalid_tag";
    if (constraint?.includes("org")) return "org_missing";
    return "invalid_reference";
  }
  if (code === "23502") return "missing_required"; // not_null_violation
  return "db_error";
}

// Dev-only debug string. Returns undefined in production so we never leak
// PG codes / constraint names to end users. Format is compact so it fits
// under the friendly message in the UI.
export function devErrorDetail(err: unknown): string | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  const code = pgErrorCode(err);
  const constraint = pgConstraint(err);
  const message =
    pgMessage(err) ?? (err instanceof Error ? err.message : String(err));
  const parts: string[] = [];
  if (code) parts.push(`pg=${code}`);
  if (constraint) parts.push(`constraint=${constraint}`);
  parts.push(message);
  return parts.join(" · ");
}
