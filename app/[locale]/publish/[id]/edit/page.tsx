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

  return (
    <main className="px-6 py-8 lg:px-10">
      <UploadWizard
        resume={{
          extensionId: draft.extensionId,
          versionId: draft.versionId,
          slug: draft.slug,
          version: draft.version,
          name: draft.name,
          category: draft.category,
          scope: draft.scope,
          bundleUploaded: draft.bundleUploaded,
          formValues: draft.formValues,
        }}
      />
    </main>
  );
}
