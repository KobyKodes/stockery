import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ItemForm } from "@/components/item-form";
import { getT } from "@/lib/i18n/server";
import { getItemRow } from "@/lib/items";
import { getLocationTree, locationOptions } from "@/lib/locations";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("detail.editItem") };
}

export default async function EditItemPage({ params }: PageProps<"/items/[id]/edit">) {
  const { id } = await params;
  const [t, item, tree, categories] = await Promise.all([
    getT(),
    getItemRow(id),
    getLocationTree(),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!item) notFound();
  const locations = locationOptions(tree, true);
  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-xl">{t("form.editTitle", { name: item.name })}</h1>
      <ItemForm item={item} locations={locations} categories={categories} />
    </main>
  );
}
