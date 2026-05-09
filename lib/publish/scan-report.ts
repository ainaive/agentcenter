// Defensive extractor for the bundle-scan report stored on `files.scanReport`.
//
// `lib/jobs/scan-bundle.ts` writes a `{ manifestOk, reason, checksum }`
// JSON blob today, but the column type is `jsonb` and there's no Zod
// schema gating writes — anything could land here in the future
// (older rows from before the format settled, the worker getting
// extended, manual SQL fixes). The dashboard renders the rejection
// reason inline, so we extract narrowly and return `null` for anything
// that doesn't match the expected shape rather than crashing.

export function extractScanReason(report: unknown): string | null {
  if (
    typeof report === "object" &&
    report !== null &&
    "reason" in report &&
    typeof (report as { reason: unknown }).reason === "string" &&
    (report as { reason: string }).reason.length > 0
  ) {
    return (report as { reason: string }).reason;
  }
  return null;
}
