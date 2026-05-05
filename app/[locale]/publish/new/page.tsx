import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getSession } from "@/lib/auth/session";
import { UploadWizard } from "@/components/publish/upload-wizard";

export async function generateMetadata() {
  const t = await getTranslations("publish.wizard");
  return { title: t("step1Title") };
}

export default async function PublishNewPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const t = await getTranslations("publish.wizard");

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold mb-8">{t("step1Title")}</h1>
      <UploadWizard />
    </main>
  );
}
