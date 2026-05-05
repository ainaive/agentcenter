export default function ExtensionDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 animate-pulse">
      {/* Breadcrumb */}
      <div className="mb-6 h-4 w-48 rounded bg-muted" />

      {/* Hero */}
      <div className="flex items-start gap-5 mb-8">
        <div className="h-16 w-16 rounded-xl bg-muted flex-shrink-0" />
        <div className="flex flex-col gap-3 flex-1">
          <div className="h-7 w-64 rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full bg-muted" />
            <div className="h-5 w-20 rounded-full bg-muted" />
          </div>
          <div className="h-4 w-96 rounded bg-muted" />
        </div>
        <div className="h-10 w-28 rounded-lg bg-muted flex-shrink-0" />
      </div>

      {/* Content + sidebar */}
      <div className="flex gap-8">
        <div className="flex-1 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`h-4 rounded bg-muted ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
          ))}
        </div>
        <div className="w-64 flex-shrink-0 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
