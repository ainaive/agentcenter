import {
  countPublishedExtensions,
  getFeaturedExtension,
} from "@/lib/db/queries/extensions";

export default async function Home() {
  const [featured, totalCount] = await Promise.all([
    getFeaturedExtension(),
    countPublishedExtensions(),
  ]);

  return (
    <div className="px-7 py-5">
      {featured && (
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
              <FeaturedTitle name={featured.name} />
            </h1>
            {featured.description && (
              <p className="text-muted-foreground mt-2.5 max-w-md text-[13.5px] leading-relaxed">
                {featured.description}
              </p>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-muted-foreground text-[13px] font-semibold">
          Browse — coming in Phase 3
        </h2>
        <p className="text-muted-foreground/60 mt-2 text-xs">
          {totalCount} extensions live in the DB; cards + filters land in Phase
          3.
        </p>
      </section>
    </div>
  );
}

function FeaturedTitle({ name }: { name: string }) {
  const words = name.split(" ");
  if (words.length < 2) {
    return <span className="text-primary font-light italic">{name}</span>;
  }
  const lead = words.slice(0, -1).join(" ");
  const tail = words[words.length - 1];
  return (
    <>
      {lead}{" "}
      <span className="text-primary font-light italic">{tail}</span>
    </>
  );
}
