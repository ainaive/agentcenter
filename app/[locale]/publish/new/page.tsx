import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getSession } from "@/lib/auth/session";
import { UploadWizard } from "@/components/publish/upload-wizard";

export async function generateMetadata() {
  const t = await getTranslations("publish.wizard");
  return { title: t("title") };
}

export default async function PublishNewPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  // The wizard renders its own header (rail layout, sticky preview, etc.).
  // Wrapping it again here would clash with the design's centred title.
  return (
    <main className="px-6 py-8 lg:px-10">
      <UploadWizard />
    </main>
  );
}
