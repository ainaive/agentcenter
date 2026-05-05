import "server-only";
import { cookies } from "next/headers";

import { isValidTheme, THEME_COOKIE_NAME, type Theme } from "./theme";

export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  const value = store.get(THEME_COOKIE_NAME)?.value;
  return isValidTheme(value) ? value : "ivory";
}
