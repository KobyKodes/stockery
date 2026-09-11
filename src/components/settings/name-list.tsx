"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ReorderableList } from "@/components/settings/reorderable-list";
import { useToast } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/fetcher";

export type NamedRow = { id: string; name: string; sortOrder: number; itemCount: number };

type Props = {
  rows: NamedRow[];
  /** "/api/locations" or "/api/categories" */
  endpoint: string;
  noun: string;
  /** What happens to items when this is deleted. */
  deleteNote: string;
};

// Rename, reorder and delete for locations and categories. Both lists behave
// the same way, so they share this component.
export function NameList({ rows: initial, endpoint, noun, deleteNote }: Props) {
  const { toast } = useToast();
  const [rows, setRows] = useState(initial);
  const [adding, setAdding] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleting, setDeleting] = useState<NamedRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function fail(e: unknown, fallback: string) {
    setError(e instanceof Error ? e.message : fallback);
  }

  async function add() {
    const name = adding.trim();
    if (!name) return;
    setBusy(true);
    setError("");
    try {
      const created = await api<{ id: string; name: string; sortOrder: number }>(endpoint, {
        method: "POST",
        body: { name },
      });
      setRows((r) => [...r, { ...created, itemCount: 0 }]);
      setAdding("");
      toast(`Added ${created.name}`);
    } catch (e) {
      fail(e, `Couldn't add that ${noun}.`);
    } finally {
      setBusy(false);
    }
  }

  async function rename(id: string) {
    const name = editingName.trim();
    if (!name) return;
    setBusy(true);
    setError("");
    try {
      await api(`${endpoint}/${id}`, { method: "PATCH", body: { name } });
      setRows((r) => r.map((x) => (x.id === id ? { ...x, name } : x)));
      setEditingId(null);
      toast("Saved");
    } catch (e) {
      fail(e, "Couldn't rename that.");
    } finally {
      setBusy(false);
    }
  }

  async function reorder(ids: string[]) {
    const next = ids.map((id, i) => ({ ...rows.find((r) => r.id === id)!, sortOrder: i }));
    setRows(next);
    setError("");
    try {
      await Promise.all(next.map((r) => api(`${endpoint}/${r.id}`, { method: "PATCH", body: { sortOrder: r.sortOrder } })));
    } catch (e) {
      fail(e, "The new order didn't save.");
    }
  }

  async function remove(row: NamedRow) {
    setBusy(true);
    setError("");
    try {
      await api(`${endpoint}/${row.id}`, { method: "DELETE" });
      setRows((r) => r.filter((x) => x.id !== row.id));
      setDeleting(null);
      toast(`Deleted ${row.name}`);
    } catch (e) {
      fail(e, "Couldn't delete that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex max-w-prose flex-col gap-4">
      {rows.length === 0 ? (
        <p className="text-base text-stencil-muted">No {noun}s yet. Add the first one below.</p>
      ) : (
        <ReorderableList
          items={rows}
          label={`${noun}s in order`}
          onReorder={(ids) => void reorder(ids)}
          renderRow={(row) => (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {editingId === row.id ? (
                <>
                  <Input
                    value={editingName}
                    autoFocus
                    aria-label={`Rename ${row.name}`}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void rename(row.id);
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <Button size="sm" disabled={busy} onClick={() => void rename(row.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate text-base font-semibold">{row.name}</span>
                  <span className="shrink-0 text-xs text-stencil-muted tabular">
                    {row.itemCount} {row.itemCount === 1 ? "item" : "items"}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Rename ${row.name}`}
                    onClick={() => {
                      setEditingId(row.id);
                      setEditingName(row.name);
                    }}
                  >
                    <Pencil aria-hidden />
                  </Button>
                  <Button size="icon-sm" variant="ghost" aria-label={`Delete ${row.name}`} onClick={() => setDeleting(row)}>
                    <Trash2 aria-hidden />
                  </Button>
                </>
              )}
            </div>
          )}
        />
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <Input
          value={adding}
          aria-label={`New ${noun} name`}
          placeholder={`New ${noun}`}
          maxLength={40}
          onChange={(e) => setAdding(e.target.value)}
        />
        <Button type="submit" disabled={busy || !adding.trim()}>
          Add {noun}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="border-l-[3px] border-bay-red pl-3 text-base">
          {error}
        </p>
      ) : null}

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.name}?</DialogTitle>
            <DialogDescription>{deleteNote}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Keep it
            </Button>
            <Button variant="destructive" disabled={busy} onClick={() => deleting && void remove(deleting)}>
              Delete {deleting?.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
