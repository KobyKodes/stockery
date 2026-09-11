import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ItemForm } from "@/components/item-form";
import { getItemRow } from "@/lib/items";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit item" };

export default async function EditItemPage({ params }: PageProps<"/items/[id]/edit">) {
  const { id } = await params;
  const [item, locations, categories] = await Promise.all([
    getItemRow(id),
    prisma.location.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!item) notFound();
  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-xl">Edit {item.name}</h1>
      <ItemForm item={item} locations={locations} categories={categories} />
    </main>
  );
}
