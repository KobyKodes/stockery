import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Filters } from "@/components/storeroom/filters";
import { ItemList } from "@/components/storeroom/item-list";
import { getT } from "@/lib/i18n/server";
import { listItems } from "@/lib/items";
import { getLocationTree, locationOptions } from "@/lib/locations";
import { prisma } from "@/lib/prisma";
import { getTakePresets } from "@/lib/settings";
import { listQuery } from "@/lib/validation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("storeroom.title") };
}

export default async function StoreroomPage({ searchParams }: PageProps<"/">) {
  const raw = await searchParams;
  const parsed = listQuery.safeParse(raw);
  const query = parsed.success ? parsed.data : {};
  const filtered = Boolean(query.q || query.location || query.category || (query.status && query.status !== "all"));

  const [t, items, tree, categories, presets] = await Promise.all([
    getT(),
    listItems(query),
    getLocationTree(),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    getTakePresets(),
  ]);
  const locations = locationOptions(tree);

  return (
    <main className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl">{t("storeroom.title")}</h1>
        <Button render={<Link href="/items/new" />}>
          <Plus aria-hidden />
          {t("storeroom.addItem")}
        </Button>
      </div>
      <Filters locations={locations} categories={categories} />
      <ItemList items={items} presets={presets} filtered={filtered} />
    </main>
  );
}
