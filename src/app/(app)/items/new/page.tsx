import type { Metadata } from "next";
import { ItemForm } from "@/components/item-form";
import { getT } from "@/lib/i18n/server";
import { getLocationTree, locationOptions } from "@/lib/locations";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("form.addTitle") };
}

export default async function NewItemPage() {
  const [t, tree, categories] = await Promise.all([
    getT(),
    getLocationTree(),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  const locations = locationOptions(tree, true);
  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-xl">{t("form.addTitle")}</h1>
      <ItemForm locations={locations} categories={categories} />
    </main>
  );
}
