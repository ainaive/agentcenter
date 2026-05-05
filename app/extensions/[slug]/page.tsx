import Link from "next/link";
import { notFound } from "next/navigation";

import { ExtHero } from "@/components/extension/ext-hero";
import { ExtMetadataPanel } from "@/components/extension/ext-metadata-panel";
import { MarkdownContent } from "@/components/markdown";
import { getExtensionBySlug } from "@/lib/db/queries/extensions";

export default async function ExtensionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ext = await getExtensionBySlug(slug);
  if (!ext) notFound();

  return (
    <div className="px-7 py-5">
      <nav className="text-muted-foreground mb-4 flex items-center gap-1 text-[12px]">
        <Link href="/extensions" className="hover:text-foreground transition">
          Browse
        </Link>
        <span className="opacity-50">/</span>
        <span className="text-foreground">{ext.name}</span>
      </nav>

      <ExtHero ext={ext} />

      <div className="mt-7 grid gap-10 lg:grid-cols-[1fr_280px]">
        <main className="min-w-0">
          {ext.readmeMd ? (
            <MarkdownContent>{ext.readmeMd}</MarkdownContent>
          ) : (
            <p className="text-muted-foreground py-12 text-center text-[13px]">
              No README has been published for this extension yet.
            </p>
          )}

          <section className="border-border mt-10 border-t pt-6">
            <h2 className="serif mb-3 text-xl tracking-tight">Versions</h2>
            <p className="text-muted-foreground text-[13px]">
              No versions have been published yet. Once the upload wizard ships
              in Phase 10, version history lands here.
            </p>
          </section>
        </main>

        <ExtMetadataPanel ext={ext} />
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ext = await getExtensionBySlug(slug);
  if (!ext) return { title: "Not found · AgentCenter" };
  return {
    title: `${ext.name} · AgentCenter`,
    description: ext.tagline ?? ext.description ?? undefined,
  };
}
