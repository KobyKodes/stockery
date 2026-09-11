"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useOnline } from "@/components/offline-banner";
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
import { useT } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n/en";

export type NamedRow = { id: string; name: string; sortOrder: number; itemCount: number };

type Props = {
  rows: NamedRow[];
  /** "/api/locations" or "/api/categories" */
  endpoint: string;
  /** Which list this is. The noun and the delete warning follow from it. */
  kind: "location" | "category";
};

// Rename, reorder and delete for locations and categories. Both lists behave
// the same way, so they share this component. The noun appears in the middle
// of six sentences, so it is looked up per language rather than passed in as
// an English word.
export function NameList({ rows: initial, endpoint, kind }: Props) {
  const { toast } = useToast();
  const t = useT();
  const [rows, setRows] = useState(initial);
  const [adding, setAdding] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleting, setDeleting] = useState<NamedRow | null>(null);
  const [busy, setBusy] = useState(false);
  const online = useOnline();
  const [error, setError] = useState("");

  const singular = t(`noun.${kind}.one` as MessageKey);
  const plural = t(`noun.${kind}.other` as MessageKey);
  const deleteNote = t(kind === "location" ? "settings.deleteNoteLocation" : "settings.deleteNoteCategory");

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
      toast(t("nameList.addedToast", { name: created.name }));
    } catch (e) {
      fail(e, t("nameList.addFailed", { singular }));
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
      toast(t("common.saved"));
    } catch (e) {
      fail(e, t("nameList.renameFailed"));
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
      fail(e, t("nameList.reorderFailed"));
    }
  }

  async function remove(row: NamedRow) {
    setBusy(true);
    setError("");
    try {
      await api(`${endpoint}/${row.id}`, { method: "DELETE" });
      setRows((r) => r.filter((x) => x.id !== row.id));
      setDeleting(null);
      toast(t("nameList.deletedToast", { name: row.name }));
    } catch (e) {
      fail(e, t("nameList.deleteFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex max-w-prose flex-col gap-4">
      {rows.length === 0 ? (
        <p className="text-base text-stencil-muted">{t("nameList.empty", { plural })}</p>
      ) : (
        <ReorderableList
          items={rows}
          label={t("nameList.order", { plural })}
          onReorder={(ids) => void reorder(ids)}
          renderRow={(row) => (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {editingId === row.id ? (
                <>
                  <Input
                    value={editingName}
                    autoFocus
                    aria-label={t("nameList.renameAria", { name: row.name })}
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
                    {t("common.save")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    {t("common.cancel")}
                  </Button>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate text-base font-semibold">
                    <bdi>{row.name}</bdi>
                  </span>
                  <span className="shrink-0 text-xs text-stencil-muted tabular">
                    {t("common.itemCount", { count: row.itemCount })}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={t("nameList.renameAria", { name: row.name })}
                    onClick={() => {
                      setEditingId(row.id);
                      setEditingName(row.name);
                    }}
                  >
                    <Pencil aria-hidden />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={t("nameList.deleteAria", { name: row.name })}
                    onClick={() => setDeleting(row)}
                  >
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
          aria-label={t("nameList.newAria", { singular })}
          placeholder={t("nameList.newPlaceholder", { singular })}
          maxLength={40}
          onChange={(e) => setAdding(e.target.value)}
        />
        <Button type="submit" disabled={busy || !online || !adding.trim()}>
          {t("nameList.addButton", { singular })}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="border-s-[3px] border-bay-red ps-3 text-base">
          {error}
        </p>
      ) : null}

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("nameList.deleteTitle", { name: deleting?.name })}</DialogTitle>
            <DialogDescription>{deleteNote}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              {t("common.keepIt")}
            </Button>
            <Button variant="destructive" disabled={busy || !online} onClick={() => deleting && void remove(deleting)}>
              {t("nameList.deleteConfirm", { name: deleting?.name })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
