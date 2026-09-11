// Which languages the app speaks, and how the choice is remembered.
//
// The locale lives in a plain cookie rather than the URL: every screen is
// behind a login and there is nothing to share or index, so a second set of
// routes would buy nothing and cost a redirect on every link.

export const LOCALES = ["en", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Read by the server on every render; written by the language button. */
export const LOCALE_COOKIE = "stockery_locale";

/** A year. The kitchen picks a language once and keeps it. */
export const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

/** The name of each language, written in that language. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Arabic runs right to left; everything else runs left to right. */
export function dirOf(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** The other language, for a two-language toggle. */
export function otherLocale(locale: Locale): Locale {
  return locale === "ar" ? "en" : "ar";
}
