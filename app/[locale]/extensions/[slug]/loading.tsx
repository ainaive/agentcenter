export default function ExtensionDetailLoading() {
  return (
    <div className="mx-auto max-w-[1180px] animate-pulse px-7 py-6">
      <div className="bg-muted mb-4 h-5 w-40 rounded" />

      <div className="border-border flex items-start gap-6 border-b pb-7">
        <div className="bg-muted size-24 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-3">
          <div className="bg-muted h-3 w-32 rounded" />
          <div className="bg-muted h-9 w-72 rounded" />
          <div className="bg-muted h-4 w-96 rounded" />
          <div className="bg-muted h-4 w-80 rounded" />
          <div className="mt-2 flex gap-2">
            <div className="bg-muted h-9 w-24 rounded" />
            <div className="bg-muted h-9 w-28 rounded" />
            <div className="bg-muted h-9 w-20 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-7 gap-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="bg-muted h-5 w-14 rounded" />
              <div className="bg-muted h-3 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 grid gap-9 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <div className="border-border mb-6 flex gap-4 border-b pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-muted h-5 w-20 rounded" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`bg-muted h-4 rounded ${i % 3 === 2 ? "w-2/3" : "w-full"}`}
            />
          ))}
        </div>
        <div className="space-y-3">
          <div className="bg-muted h-48 rounded-xl" />
          <div className="bg-muted h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
