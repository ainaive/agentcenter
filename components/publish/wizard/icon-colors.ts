// Icon-avatar palette used by both the wizard form and the live preview.
// OKLCH values are mirrored from the prototype design (AgentCenter.html
// `ICON_COLORS` near line 2608) so the rendered preview matches the
// design canvas exactly.

export const ICON_COLOR_KEYS = [
  "indigo",
  "amber",
  "emerald",
  "rose",
  "slate",
] as const;

export type IconColor = (typeof ICON_COLOR_KEYS)[number];

export const ICON_COLORS: Record<IconColor, { bg: string; fg: string }> = {
  indigo: { bg: "oklch(58% 0.18 268)", fg: "#fff" },
  amber: { bg: "oklch(72% 0.16 60)", fg: "#1a1408" },
  emerald: { bg: "oklch(62% 0.14 160)", fg: "#fff" },
  rose: { bg: "oklch(64% 0.16 12)", fg: "#fff" },
  slate: { bg: "oklch(38% 0.02 260)", fg: "#fff" },
};
