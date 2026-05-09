import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getSession } from "@/lib/auth/session";
import { getDraft } from "@/lib/actions/publish";
import { UploadWizard } from "@/components/publish/upload-wizard";

export async function generateMetadata() {
  const t = await getTranslations("publish.wizard");
  return { title: t("resumingLabel") };
}

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function PublishEditPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { id } = await params;
  const result = await getDraft(id);
  if (!result.ok) {
    // Both `not_found` and `not_owner` collapse to a 404 — we don't want
    // to leak whether an extension exists for someone else's account.
    notFound();
  }

  const { draft } = result;

  // Resume only makes sense for in-flight versions. If the version has
  // already been scanned/rejected/published, the user has nothing to do
  // here — bounce them back to the dashboard.
  if (draft.versionStatus !== "pending") {
    redirect("/publish");
  }

  const t = await getTranslations("publish.wizard");

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold mb-8">
        {t("resumingLabel")}
      </h1>
      <UploadWizard
        resume={{
          extensionId: draft.extensionId,
          versionId: draft.versionId,
          slug: draft.slug,
          version: draft.version,
          name: draft.name,
          category: draft.category,
          bundleUploaded: draft.bundleUploaded,
        }}
      />
    </main>
  );
}
