// Skeleton shown while a publish-wizard route streams. Matches the
// rough shape of <UploadWizard> — step indicator, then a tall card for
// the active step body — so layout doesn't jump when the real UI lands.
export function WizardSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10" aria-hidden>
      <div className="mb-8 flex items-center gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            {i < 2 && <span className="text-muted-foreground/40 mx-1">›</span>}
          </div>
        ))}
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 animate-pulse rounded-md bg-muted" />
          <div className="h-16 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 animate-pulse rounded-md bg-muted" />
          <div className="h-16 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-32 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}
