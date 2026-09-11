import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";

export default async function ItemNotFound() {
  const t = await getT();
  return (
    <main className="flex flex-col items-start gap-4 py-12">
      <p className="text-lg">{t("detail.notFound")}</p>
      <Button variant="secondary" render={<Link href="/" />}>
        {t("common.backToStoreroom")}
      </Button>
    </main>
  );
}
