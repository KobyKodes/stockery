import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Filters } from "@/components/storeroom/filters";
import { ItemList } from "@/components/storeroom/item-list";
import { listItems } from "@/lib/items";
import { prisma } from "@/lib/prisma";
import { getTakePresets } from "@/lib/settings";
import { listQuery } from "@/lib/validation";

export const metadata: Metadata = { title: "Storeroom" };

export default async function StoreroomPage({ searchParams }: PageProps<"/">) {
  const raw = await searchParams;
  const parsed = listQuery.safeParse(raw);
  const query = parsed.success ? parsed.data : {};
  const filtered = Boolean(query.q || query.location || query.category || (query.status && query.status !== "all"));

  const [items, locations, categories, presets] = await Promise.all([
    listItems(query),
    prisma.location.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    getTakePresets(),
  ]);

  return (
    <main className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl">Storeroom</h1>
        <Button render={<Link href="/items/new" />}>
          <Plus aria-hidden />
          Add item
        </Button>
      </div>
      <Filters locations={locations} categories={categories} />
      <ItemList items={items} presets={presets} filtered={filtered} />
    </main>
  );
}
