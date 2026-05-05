import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ExtGrid } from "@/components/extension/ext-grid";
import {
  countPublishedExtensions,
  getFeaturedExtension,
  listExtensions,
} from "@/lib/db/queries/extensions";

const TRENDING_LIMIT = 8;

export default async function Home() {
  const [featured, totalCount, trending] = await Promise.all([
    getFeaturedExtension(),
    countPublishedExtensions(),
    // Home trending is cross-dept by design (discovery > scoping).
    listExtensions({ category: "skills", sort: "downloads", dept: "__all" }),
  ]);

  return (
    <div className="px-7 py-5">
      {featured && (
        <section className="bg-card border-border relative mb-7 overflow-hidden rounded-xl border p-9 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
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

      <section className="mb-2 flex items-baseline justify-between">
        <h2 className="serif text-xl tracking-tight">Trending Skills</h2>
        <Link
          href="/extensions"
          className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-[12.5px] font-semibold transition-colors"
        >
          Browse all {totalCount}
          <ArrowRight className="size-3.5" />
        </Link>
      </section>

      <section className="mt-4">
        <ExtGrid items={trending.slice(0, TRENDING_LIMIT)} />
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
