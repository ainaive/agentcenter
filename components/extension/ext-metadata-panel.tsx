"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

import { deptPath } from "@/lib/data/departments";
import { Link } from "@/lib/i18n/navigation";
import type { ExtensionDetail } from "@/lib/db/queries/extensions";
import { tagLabel } from "@/lib/tags";
import type { Locale } from "@/types";

interface ExtMetadataPanelProps {
  ext: ExtensionDetail;
  locale?: Locale;
}

export function ExtMetadataPanel({
  ext,
  locale = "en",
}: ExtMetadataPanelProps) {
  const t = useTranslations("metadata");
  const tx = useTranslations("taxonomy");
  const deptTrail = ext.deptId ? deptPath(ext.deptId, locale) : null;

  return (
    <aside className="text-[12.5px]">
      <Section title={t("sectionTitle")}>
        <Row label={t("slug")}>
          <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-[11.5px]">
            {ext.slug}
          </code>
        </Row>
        <Row label={t("license")}>
          {ext.licenseSpdx ?? <Empty />}
        </Row>
        <Row label={t("homepage")}>
          {ext.homepageUrl ? <ExtLink href={ext.homepageUrl} /> : <Empty />}
        </Row>
        <Row label={t("repository")}>
          {ext.repoUrl ? <ExtLink href={ext.repoUrl} /> : <Empty />}
        </Row>
        <Row label={t("compatibility")}>
          {ext.compatibilityJson ? (
            <code className="bg-muted block rounded p-2 font-mono text-[11px] whitespace-pre-wrap">
              {JSON.stringify(ext.compatibilityJson, null, 2)}
            </code>
          ) : (
            <Empty />
          )}
        </Row>
      </Section>

      <Section title={t("categorizationTitle")}>
        <Row label={t("scope")}>{t(`scopeValues.${ext.scope}`)}</Row>
        <Row label={t("functional")}>
          <span className="text-foreground font-semibold">
            {tx(`funcCat.${ext.funcCat}`)}
          </span>
          <span className="text-muted-foreground"> / {tx(`l1.${ext.subCat}`)}</span>
          {ext.l2 && (
            <span className="text-muted-foreground"> / {tx(`l2.${ext.l2}`)}</span>
          )}
        </Row>
        {deptTrail && (
          <Row label={t("department")}>
            <span className="text-muted-foreground">
              {deptTrail.slice(0, -1).join(" / ")}
              {deptTrail.length > 1 ? " / " : ""}
            </span>
            <span className="text-foreground font-semibold">
              {deptTrail[deptTrail.length - 1]}
            </span>
          </Row>
        )}
      </Section>

      {ext.tagIds.length > 0 && (
        <Section title={t("tagsTitle")}>
          <div className="flex flex-wrap gap-1">
            {ext.tagIds.map((tag) => (
              <Link
                key={tag}
                href={`/extensions?tags=${encodeURIComponent(tag)}&dept=__all`}
                className="border-border text-muted-foreground hover:border-primary hover:text-primary rounded border px-1.5 py-0.5 font-mono text-[11px] font-semibold transition"
              >
                #{tagLabel(tag, locale)}
              </Link>
            ))}
          </div>
        </Section>
      )}
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border mb-5 border-b pb-5 last:mb-0 last:border-b-0 last:pb-0">
      <h3 className="text-muted-foreground mb-3 text-[10.5px] font-bold tracking-wider uppercase">
        {title}
      </h3>
      <dl className="flex flex-col gap-2.5">{children}</dl>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-[10.5px] font-semibold tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-foreground/85 text-[12.5px]">{children}</dd>
    </div>
  );
}

function Empty() {
  return <span className="text-muted-foreground/60">—</span>;
}

function ExtLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary inline-flex items-center gap-1 break-all hover:underline"
    >
      <span className="truncate">{href.replace(/^https?:\/\//, "")}</span>
      <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}
