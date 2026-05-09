// Decide what action the publish dashboard exposes for an extension based
// on its latest version state. Pulled out as a pure function so the
// state-routing logic (which step the resume link lands on, what status
// label to show, whether the row is clickable) is unit-testable without
// mounting the dashboard server component.
//
// `null` status covers the (currently unreachable, but defensive) case of
// an extension with no versions — ROW_ACTIONS treats it the same as a
// non-resumable row.
export type RowAction =
  | "resume_upload" // pending, no bundle uploaded yet → land on Step 2
  | "resume_submit" // pending, bundle uploaded but not submitted → Step 3
  | "scanning" // submitted, bundle scan in flight
  | "ready" // scan passed, awaiting publish
  | "rejected" // scan failed
  | "none"; // no action / unknown status

export function rowAction(
  status: string | null,
  bundleUploaded: boolean,
): RowAction {
  if (status === "pending") {
    return bundleUploaded ? "resume_submit" : "resume_upload";
  }
  if (status === "scanning") return "scanning";
  if (status === "ready") return "ready";
  if (status === "rejected") return "rejected";
  return "none";
}

export function isResumable(action: RowAction): boolean {
  return action === "resume_upload" || action === "resume_submit";
}
