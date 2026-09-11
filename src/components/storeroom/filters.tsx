"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { Option } from "@/components/creatable-select";
import { cn } from "@/lib/utils";

type Props = {
  locations: Option[];
  categories: Option[];
};

// Every filter lives in the URL so a view can be bookmarked or shared.
export function Filters({ locations, categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const location = params.get("location") ?? "";
  const category = params.get("category") ?? "";
  const status = params.get("status") ?? "all";

  const [search, setSearch] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) {
    // The URL changed underneath us (back button); adopt it.
    setLastQ(q);
    setSearch(q);
  }

  function update(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v && v !== "all") sp.set(k, v);
      else sp.delete(k);
    }
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => update({ q: search }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-stencil-muted" />
          <Input
            type="search"
            inputMode="search"
            name="q"
            aria-label="Search items"
            placeholder="Search items"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <NativeSelect
          name="location"
          aria-label="Location"
          className="sm:w-56"
          value={location}
          onChange={(e) => update({ location: e.target.value })}
        >
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
          <option value="none">Unassigned</option>
        </NativeSelect>
        <div role="group" aria-label="Stock status" className="flex h-tap shrink-0 rounded-control border border-stencil">
          {(["all", "low", "out"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => update({ status: s })}
              className={cn(
                "flex-1 px-4 text-base font-semibold sm:flex-none",
                status === s ? "bg-stencil text-paper" : "text-stencil",
              )}
            >
              {s === "all" ? "All" : s === "low" ? "Low" : "Out"}
            </button>
          ))}
        </div>
      </div>
      <div role="group" aria-label="Category" className="flex gap-2 overflow-x-auto no-scrollbar">
        <Chip active={!category} onClick={() => update({ category: "" })}>
          All categories
        </Chip>
        {categories.map((c) => (
          <Chip key={c.id} active={category === c.id} onClick={() => update({ category: c.id })}>
            {c.name}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 rounded-control border px-3 text-xs font-semibold",
        active ? "border-stencil bg-stencil text-paper" : "border-rule-soft bg-transparent text-stencil",
      )}
    >
      {children}
    </button>
  );
}
