import type { Metadata } from "next";
import { ItemForm } from "@/components/item-form";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Add item" };

export default async function NewItemPage() {
  const [locations, categories] = await Promise.all([
    prisma.location.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-xl">Add item</h1>
      <ItemForm locations={locations} categories={categories} />
    </main>
  );
}
