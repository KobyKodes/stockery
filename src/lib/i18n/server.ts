import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n/config";
import { createTranslator, type Translate } from "@/lib/i18n/translate";

// Reading the chosen language on the server. Every screen already renders
// dynamically (a session and a database query), so the cookie read costs
// nothing extra.

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getT(): Promise<Translate> {
  return createTranslator(await getLocale());
}

/** Both at once, for the common case of a page that needs the locale too. */
export async function getI18n(): Promise<{ locale: Locale; t: Translate }> {
  const locale = await getLocale();
  return { locale, t: createTranslator(locale) };
}
