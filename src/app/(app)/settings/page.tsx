import type { Metadata } from "next";
import { NameList } from "@/components/settings/name-list";
import { PresetEditor } from "@/components/settings/preset-editor";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getTakePresets } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("settings.title") };
}

export default async function SettingsPage() {
  const [t, locations, categories, presets] = await Promise.all([
    getT(),
    prisma.location.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, sortOrder: true, _count: { select: { items: true } } },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, sortOrder: true, _count: { select: { items: true } } },
    }),
    getTakePresets(),
  ]);

  const shape = (rows: typeof locations) =>
    rows.map((r) => ({ id: r.id, name: r.name, sortOrder: r.sortOrder, itemCount: r._count.items }));

  return (
    <main className="flex flex-col gap-12">
      <h1 className="text-xl">{t("settings.title")}</h1>

      <section aria-labelledby="locations" className="flex flex-col gap-3">
        <h2 id="locations" className="rule-heavy pt-3 text-lg">
          {t("settings.locations")}
        </h2>
        <p className="max-w-prose text-base text-stencil-muted">{t("settings.locationsIntro")}</p>
        <NameList rows={shape(locations)} endpoint="/api/locations" kind="location" />
      </section>

      <section aria-labelledby="categories" className="flex flex-col gap-3">
        <h2 id="categories" className="rule-heavy pt-3 text-lg">
          {t("settings.categories")}
        </h2>
        <p className="max-w-prose text-base text-stencil-muted">{t("settings.categoriesIntro")}</p>
        <NameList rows={shape(categories)} endpoint="/api/categories" kind="category" />
      </section>

      <section aria-labelledby="presets" className="flex flex-col gap-3">
        <h2 id="presets" className="rule-heavy pt-3 text-lg">
          {t("settings.presets")}
        </h2>
        <PresetEditor presets={presets} />
      </section>
    </main>
  );
}
