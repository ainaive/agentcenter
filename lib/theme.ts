export type Theme = "ivory" | "dark";

export const THEME_COOKIE_NAME = "theme";

export const VALID_THEMES: ReadonlyArray<Theme> = ["ivory", "dark"];

export function isValidTheme(value: unknown): value is Theme {
  return typeof value === "string" && VALID_THEMES.includes(value as Theme);
}
