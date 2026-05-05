import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AgentCenter — AI Agent Extension Marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "oklch(98.5% 0.008 80)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: "0 80px",
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <div
            style={{
              background: "oklch(40% 0.09 35)",
              color: "oklch(98% 0.005 70)",
              width: 72,
              height: 72,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontStyle: "italic",
              fontWeight: 500,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 64, fontWeight: 300, color: "oklch(22% 0.02 60)", letterSpacing: "-2px" }}>
            Agent
            <span style={{ color: "oklch(40% 0.09 35)", fontStyle: "italic" }}>Center</span>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 28, color: "oklch(48% 0.015 60)", textAlign: "center", maxWidth: 720 }}>
          Discover and install AI agent extensions — Skills, MCP servers, slash commands, and plugins.
        </div>
      </div>
    ),
    { ...size },
  );
}
