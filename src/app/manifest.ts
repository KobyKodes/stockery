import type { MetadataRoute } from "next";
import { dirOf } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { THEME_COLOR } from "@/lib/theme";

// What the phone reads when the app is added to the home screen. The locale
// cookie is already read on every render, so the manifest speaks whichever
// language the kitchen picked.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { locale, t } = await getI18n();

  return {
    id: "/",
    name: "Stockery",
    short_name: "Stockery",
    description: t("meta.description"),
    lang: locale,
    dir: dirOf(locale),
    // Launching at the storeroom list, standalone, so it opens with no browser
    // chrome and behaves like the app it is.
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android crops icons to its own shape; this one keeps the box clear of
      // the crop.
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
