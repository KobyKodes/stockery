"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, LOCALE_MAX_AGE, isLocale, type Locale } from "@/lib/i18n/config";

// Cookies cannot be written while a Server Component renders, so the language
// button calls this and then refreshes: one round trip, new language.

export async function setLocale(locale: Locale): Promise<void> {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_MAX_AGE,
    sameSite: "lax",
  });
}
