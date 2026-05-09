// Skeleton for the publish dashboard's list of drafts. Matches the row
// layout of `app/[locale]/publish/page.tsx` so the real list slides in
// without a layout shift.
export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10" aria-hidden>
      <div className="mb-8 flex items-center justify-between">
        <div className="h-7 w-40 animate-pulse rounded bg-muted" />
        <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
      </div>
      <ul className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4"
          >
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          </li>
        ))}
      </ul>
    </div>
  );
}
