import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, Cairo, IBM_Plex_Sans_Arabic } from "next/font/google";
import { dirOf } from "@/lib/i18n/config";
import { LocaleProvider } from "@/lib/i18n/client";
import { getI18n } from "@/lib/i18n/server";
import { THEME_COLOR } from "@/lib/theme";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

// Barlow carries no Arabic glyphs, so these sit behind it in the same stack:
// the browser falls through per glyph and each script keeps its own face.
// Plex Arabic answers Barlow for running text; Cairo's bold answers the
// condensed display face in headings and numerals.
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  const name = "Stockery";
  return {
    title: { default: name, template: `%s | ${name}` },
    description: t("meta.description"),
    applicationName: name,
    // Added to the home screen, it opens without browser chrome and titles
    // itself "Stockery" rather than the page it happens to be on.
    appleWebApp: { capable: true, title: name, statusBarStyle: "default" },
    // Codes and pack counts are numbers, not phone numbers; iOS must not turn
    // them into call links.
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale } = await getI18n();

  return (
    <html
      lang={locale}
      dir={dirOf(locale)}
      className={`${barlow.variable} ${barlowCondensed.variable} ${plexArabic.variable} ${cairo.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
