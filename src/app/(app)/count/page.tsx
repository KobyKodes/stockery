import type { Metadata } from "next";
import { CountWalk } from "@/components/count/count-walk";
import { listItems } from "@/lib/items";

export const metadata: Metadata = { title: "Count" };

export default async function CountPage() {
  const items = await listItems();
  return (
    <main className="flex flex-col gap-2">
      <h1 className="text-xl">Full count</h1>
      <p className="max-w-prose text-base text-stencil-muted">
        Walk the shelves in order and enter what is actually there. Nothing is saved until you finish.
      </p>
      <div className="mt-4">
        <CountWalk items={items} />
      </div>
    </main>
  );
}
