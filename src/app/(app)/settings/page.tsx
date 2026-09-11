import type { Metadata } from "next";
import { NameList } from "@/components/settings/name-list";
import { PresetEditor } from "@/components/settings/preset-editor";
import { prisma } from "@/lib/prisma";
import { getTakePresets } from "@/lib/settings";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [locations, categories, presets] = await Promise.all([
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
      <h1 className="text-xl">Settings</h1>

      <section aria-labelledby="locations" className="flex flex-col gap-3">
        <h2 id="locations" className="rule-heavy pt-3 text-lg">
          Locations
        </h2>
        <p className="max-w-prose text-base text-stencil-muted">
          The order here is the order you walk the shelves during a full count. Drag a row to change it.
        </p>
        <NameList
          rows={shape(locations)}
          endpoint="/api/locations"
          noun="location"
          deleteNote="The items stay in the storeroom and move to Unassigned."
        />
      </section>

      <section aria-labelledby="categories" className="flex flex-col gap-3">
        <h2 id="categories" className="rule-heavy pt-3 text-lg">
          Categories
        </h2>
        <p className="max-w-prose text-base text-stencil-muted">
          Categories are the filter chips above the storeroom list. The order here is the order they appear in.
        </p>
        <NameList
          rows={shape(categories)}
          endpoint="/api/categories"
          noun="category"
          deleteNote="The items stay in the storeroom and lose their category."
        />
      </section>

      <section aria-labelledby="presets" className="flex flex-col gap-3">
        <h2 id="presets" className="rule-heavy pt-3 text-lg">
          Take presets
        </h2>
        <PresetEditor presets={presets} />
      </section>
    </main>
  );
}
