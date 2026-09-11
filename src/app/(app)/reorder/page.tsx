import type { Metadata } from "next";
import { ReorderList } from "@/components/reorder/reorder-list";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { listReorder } from "@/lib/reorder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("reorder.title") };
}

export default async function ReorderPage() {
  const [t, entries, addable] = await Promise.all([
    getT(),
    listReorder(),
    prisma.item.findMany({
      where: { archived: false },
      orderBy: [{ location: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  const toBuy = entries.filter((e) => !e.checked).length;

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl">{t("reorder.title")}</h1>
        <p className="mt-1 max-w-prose text-base text-stencil-muted">
          {entries.length === 0 ? t("reorder.emptyIntro") : t("reorder.intro", { count: toBuy })}
        </p>
      </div>
      <ReorderList entries={entries} addable={addable} />
    </main>
  );
}
