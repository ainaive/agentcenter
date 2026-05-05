import { ImageResponse } from "next/og";

import { getExtensionBySlug } from "@/lib/db/queries/extensions";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ext = await getExtensionBySlug(slug);

  const name = ext?.name ?? slug;
  const description = ext?.description ?? "";
  const category = ext?.category ?? "";
  const emoji = ext?.iconEmoji ?? "🧩";

  return new ImageResponse(
    (
      <div
        style={{
          background: "oklch(98.5% 0.008 80)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
        }}
      >
        {/* Top: wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              background: "oklch(40% 0.09 35)",
              color: "oklch(98% 0.005 70)",
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontStyle: "italic",
              fontWeight: 500,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 24, color: "oklch(22% 0.02 60)", letterSpacing: "-1px" }}>
            Agent<span style={{ color: "oklch(40% 0.09 35)", fontStyle: "italic" }}>Center</span>
          </div>
        </div>

        {/* Middle: extension info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: "oklch(96.5% 0.012 70)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
              }}
            >
              {emoji}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 52, fontWeight: 600, color: "oklch(22% 0.02 60)", letterSpacing: "-1.5px" }}>
                {name}
              </div>
              <div
                style={{
                  fontSize: 18,
                  background: "oklch(94% 0.018 70)",
                  color: "oklch(35% 0.07 35)",
                  padding: "4px 14px",
                  borderRadius: 20,
                  width: "fit-content",
                }}
              >
                {category}
              </div>
            </div>
          </div>
          {description && (
            <div style={{ fontSize: 24, color: "oklch(48% 0.015 60)", maxWidth: 900 }}>
              {description.slice(0, 120)}{description.length > 120 ? "…" : ""}
            </div>
          )}
        </div>

        {/* Bottom: slug */}
        <div style={{ fontSize: 18, color: "oklch(60% 0.015 60)", fontFamily: "monospace" }}>
          agentcenter.app/extensions/{slug}
        </div>
      </div>
    ),
    { ...size },
  );
}
