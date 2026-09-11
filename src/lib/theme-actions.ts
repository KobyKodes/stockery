"use server";

import { cookies } from "next/headers";
import { THEME_COOKIE, THEME_MAX_AGE, isTheme, type Theme } from "@/lib/theme";

// Cookies cannot be written while a Server Component renders, so the
// Appearance setting calls this and then refreshes: one round trip, and the
// whole tree comes back painted in the new theme.

export async function setTheme(theme: Theme): Promise<void> {
  if (!isTheme(theme)) return;
  const store = await cookies();
  store.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: THEME_MAX_AGE,
    sameSite: "lax",
  });
}
