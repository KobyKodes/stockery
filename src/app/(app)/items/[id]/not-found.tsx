import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ItemNotFound() {
  return (
    <main className="flex flex-col items-start gap-4 py-12">
      <p className="text-lg">That item isn&apos;t in the storeroom.</p>
      <Button variant="secondary" render={<Link href="/" />}>
        Back to the storeroom
      </Button>
    </main>
  );
}
