import type { Metadata } from "next";

export const metadata: Metadata = { title: "Count" };

export default function CountPage() {
  return (
    <main>
      <h1 className="text-xl">Count</h1>
    </main>
  );
}
