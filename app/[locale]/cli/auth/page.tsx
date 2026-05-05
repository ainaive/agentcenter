import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { CliAuthForm } from "./cli-auth-form";
import { getSession } from "@/lib/auth/session";

export default async function CliAuthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [session, t] = await Promise.all([
    getSession(),
    getTranslations("cliAuth"),
  ]);

  if (!session) {
    redirect(`/${locale}/sign-in`);
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-20">
      <div className="bg-card border-border w-full max-w-[400px] rounded-xl border p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="mb-7 text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
            <span className="serif text-primary text-xl font-light italic">
              A
            </span>
          </div>
          <h1 className="serif text-2xl tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-2 text-[13px] leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
        <CliAuthForm />
      </div>
    </div>
  );
}
