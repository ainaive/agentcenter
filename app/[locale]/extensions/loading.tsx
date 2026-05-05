export default function ExtensionsLoading() {
  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Filter bar skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-muted animate-pulse" />
        ))}
      </div>
      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
            </div>
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="flex gap-2 mt-auto pt-2">
              <div className="h-5 w-14 rounded-full bg-muted" />
              <div className="h-5 w-14 rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
