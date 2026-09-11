"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useOnline } from "@/components/offline-banner";
import { useToast } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/fetcher";
import { MAX_PRESETS, normalisePresets } from "@/lib/presets";

// The quick buttons in the take sheet. Small whole numbers, at most six.
export function PresetEditor({ presets: initial }: { presets: number[] }) {
  const { toast } = useToast();
  const [presets, setPresets] = useState(initial);
  const [adding, setAdding] = useState("");
  const [busy, setBusy] = useState(false);
  const online = useOnline();
  const [error, setError] = useState("");

  async function save(next: number[]) {
    const clean = normalisePresets(next);
    setBusy(true);
    setError("");
    try {
      const result = await api<{ takePresets: number[] }>("/api/settings", {
        method: "PATCH",
        body: { takePresets: clean },
      });
      setPresets(result.takePresets);
      toast("Saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The presets didn't save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex max-w-prose flex-col gap-4">
      <ul className="flex flex-wrap gap-2">
        {presets.map((n) => (
          <li key={n}>
            <span className="flex h-tap items-center gap-2 rounded-control border border-stencil pl-4 pr-2 text-base font-semibold tabular">
              {n}
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`Remove the ${n} preset`}
                disabled={busy || presets.length === 1}
                onClick={() => void save(presets.filter((p) => p !== n))}
              >
                <X aria-hidden />
              </Button>
            </span>
          </li>
        ))}
      </ul>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Math.floor(Number(adding));
          if (!Number.isFinite(n) || n < 1) return;
          setAdding("");
          void save([...presets, n]);
        }}
      >
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          className="w-28"
          aria-label="New preset amount"
          placeholder="Amount"
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
        />
        <Button type="submit" disabled={busy || !online || presets.length >= MAX_PRESETS || !adding.trim()}>
          Add preset
        </Button>
      </form>

      <p className="text-xs text-stencil-muted">
        Up to {MAX_PRESETS} amounts. They appear as one-tap buttons in the take sheet, alongside a whole pack where an item has one.
      </p>

      {error ? (
        <p role="alert" className="border-l-[3px] border-bay-red pl-3 text-base">
          {error}
        </p>
      ) : null}
    </div>
  );
}
