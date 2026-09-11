import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { en, type Dictionary, type Message, type MessageKey } from "@/lib/i18n/en";
import { ar } from "@/lib/i18n/ar";

// Turning a key into a sentence. Two steps: choose the plural shape, then
// fill the {placeholders}. English has two shapes, Arabic has six, so the
// choice is left to Intl.PluralRules rather than an `n === 1` test.

const DICTIONARIES: Record<Locale, Dictionary> = { en, ar };

export type Params = Record<string, string | number | null | undefined>;

export type Translate = (key: MessageKey, params?: Params) => string;

const PLACEHOLDER = /\{(\w+)\}/g;

function fill(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(PLACEHOLDER, (whole, name: string) => {
    const value = params[name];
    return value === undefined || value === null ? whole : String(value);
  });
}

function shape(message: Message, rules: Intl.PluralRules, params?: Params): string {
  if (typeof message === "string") return message;
  const count = Number(params?.count);
  const rule = Number.isFinite(count) ? rules.select(count) : "other";
  return message[rule] ?? message.other ?? Object.values(message)[0] ?? "";
}

/**
 * A `t` bound to one language. English is the fallback for any key a
 * translation somehow misses, so a screen never renders a raw key.
 */
export function createTranslator(locale: Locale): Translate {
  const dictionary = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
  const rules = new Intl.PluralRules(locale);
  return (key, params) => {
    const message = dictionary[key] ?? en[key];
    if (message === undefined) return key;
    return fill(shape(message, rules, params), params);
  };
}

/**
 * Digits stay Western in both languages. The design leans on tabular figures
 * lining up down a column, and Arabic-Indic digits break that alignment
 * against the Latin-only display face.
 */
export function formatNumber(value: number): string {
  return value.toLocaleString("en-GB");
}
