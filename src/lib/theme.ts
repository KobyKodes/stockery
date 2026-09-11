// Light or dark, and how the choice is remembered.
//
// Like the language, the theme lives in a plain cookie rather than the URL or
// the database: every screen is behind a login, and the server already reads
// cookies on every render, so the choice costs nothing and is applied before
// the first paint — no flash of the wrong theme, and no script to prevent it.

export const THEMES = ["system", "light", "dark"] as const;

export type Theme = (typeof THEMES)[number];

/** Follow the phone until someone says otherwise. */
export const DEFAULT_THEME: Theme = "system";

/** Read by the root layout on every render; written by the Appearance setting. */
export const THEME_COOKIE = "stockery_theme";

/** A year, to match the language cookie. */
export const THEME_MAX_AGE = 60 * 60 * 24 * 365;

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/**
 * What goes on <html data-theme>. "system" stamps nothing at all, which is
 * what lets the `prefers-color-scheme` rule in globals.css take over.
 */
export function themeAttr(theme: Theme): Theme | undefined {
  return theme === "system" ? undefined : theme;
}

// The one place hex values live outside globals.css: the browser chrome
// colour is metadata, not CSS, so it cannot read a token. Keep these equal to
// the two arms of --color-concrete in src/app/globals.css.
export const THEME_COLOR_LIGHT = "#E9E7E1";
export const THEME_COLOR_DARK = "#0F1317";

/**
 * Browser chrome colour. An explicit choice pins one value; "system" hands
 * the browser both and lets the media query pick, the same way the CSS does.
 */
export function themeColorFor(theme: Theme) {
  if (theme === "light") return THEME_COLOR_LIGHT;
  if (theme === "dark") return THEME_COLOR_DARK;
  return [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR_DARK },
  ];
}
