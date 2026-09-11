"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, dirOf, type Locale } from "@/lib/i18n/config";
import { createTranslator, type Translate } from "@/lib/i18n/translate";

// The client half. The root layout reads the cookie once and hands the
// answer down, so a client component never guesses and the server and first
// client render always agree.

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** `t("nav.count")` inside any client component. */
export function useT(): Translate {
  const locale = useLocale();
  return useMemo(() => createTranslator(locale), [locale]);
}

/** The locale, its `t`, and its writing direction together. */
export function useI18n(): { locale: Locale; t: Translate; dir: "ltr" | "rtl" } {
  const locale = useLocale();
  return useMemo(() => ({ locale, t: createTranslator(locale), dir: dirOf(locale) }), [locale]);
}
