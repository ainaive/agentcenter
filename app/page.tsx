export default function Home() {
  return (
    <div className="px-7 py-5">
      <section className="bg-card border-border relative mb-6 overflow-hidden rounded-xl border p-9 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div
          aria-hidden
          className="bg-primary/12 pointer-events-none absolute -top-20 -right-20 size-72 rounded-full blur-3xl"
        />
        <div
          aria-hidden
          className="bg-primary/8 pointer-events-none absolute -bottom-24 right-32 size-52 rounded-full blur-3xl"
        />
        <div className="relative">
          <div className="text-primary font-mono text-[10.5px] font-medium tracking-[0.18em] uppercase">
            · Featured this week
          </div>
          <h1 className="serif mt-2.5 text-4xl leading-tight tracking-tight">
            Web Search{" "}
            <span className="text-primary font-light italic">Pro</span>
          </h1>
          <p className="text-muted-foreground mt-2.5 max-w-md text-[13.5px] leading-relaxed">
            Real-time web search with citations, summarization, and deep-dive
            mode.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-muted-foreground text-[13px] font-semibold">
          Browse — coming in Phase 3
        </h2>
        <p className="text-muted-foreground/60 mt-2 text-xs">
          16 mock extensions loaded; cards + filters land in Phase 3.
        </p>
      </section>
    </div>
  );
}
