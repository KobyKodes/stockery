import type { Metadata } from "next";
import { CountWalk } from "@/components/count/count-walk";
import { getT } from "@/lib/i18n/server";
import { listItems } from "@/lib/items";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("nav.count") };
}

export default async function CountPage() {
  const [t, items] = await Promise.all([getT(), listItems()]);
  return (
    <main className="flex flex-col gap-2">
      <h1 className="text-xl">{t("count.title")}</h1>
      <p className="max-w-prose text-base text-stencil-muted">{t("count.intro")}</p>
      <div className="mt-4">
        <CountWalk items={items} />
      </div>
    </main>
  );
}
