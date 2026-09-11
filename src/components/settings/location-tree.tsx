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

export type LocationNode = {
  id: string;
  name: string;
  sortOrder: number;
  itemCount: number;
  children: LocationNode[];
};

type Created = { id: string; name: string; sortOrder: number; parentId: string | null };

// The location tree for Settings: stores in walk order, each store with its
// shelves. A store with shelves holds no items directly; a store with none
// holds items itself. Names, order and nesting are all editable here.
export function LocationTree({ tree }: { tree: LocationNode[] }) {
  const { toast } = useToast();
  const t = useT();
  const online = useOnline();
  const [stores, setStores] = useState(tree);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleting, setDeleting] = useState<LocationNode | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function fail(e: unknown, fallback: string) {
    setError(e instanceof Error ? e.message : fallback);
  }

  // Replace a shelf list under a given store id (or the store list when null).
  function setChildren(storeId: string | null, next: LocationNode[]) {
    if (storeId === null) return setStores(next);
    setStores((s) => s.map((store) => (store.id === storeId ? { ...store, children: next } : store)));
  }

  async function add(name: string, parentId: string | null, current: LocationNode[]) {
    setBusy(true);
    setError("");
    try {
      const created = await api<Created>("/api/locations", { method: "POST", body: { name, parentId } });
      setChildren(parentId, [...current, { ...created, itemCount: 0, children: [] }]);
      toast(t("nameList.addedToast", { name: created.name }));
      return true;
    } catch (e) {
      fail(e, t("locations.addFailed"));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function rename(id: string, parentId: string | null, current: LocationNode[]) {
    const name = editingName.trim();
    if (!name) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/locations/${id}`, { method: "PATCH", body: { name } });
      setChildren(parentId, current.map((n) => (n.id === id ? { ...n, name } : n)));
      setEditingId(null);
      toast(t("common.saved"));
    } catch (e) {
      fail(e, t("nameList.renameFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function reorder(parentId: string | null, current: LocationNode[], ids: string[]) {
    const byId = new Map(current.map((n) => [n.id, n]));
    const next = ids.map((id, i) => ({ ...byId.get(id)!, sortOrder: i }));
    setChildren(parentId, next);
    setError("");
    try {
      await Promise.all(
        next.map((n) => api(`/api/locations/${n.id}`, { method: "PATCH", body: { sortOrder: n.sortOrder } })),
      );
    } catch (e) {
      fail(e, t("nameList.reorderFailed"));
    }
  }

  async function remove(node: LocationNode, parentId: string | null, current: LocationNode[]) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/locations/${node.id}`, { method: "DELETE" });
      setChildren(parentId, current.filter((n) => n.id !== node.id));
      setDeleting(null);
      toast(t("nameList.deletedToast", { name: node.name }));
    } catch (e) {
      fail(e, t("nameList.deleteFailed"));
    } finally {
      setBusy(false);
    }
  }

  function nodeRow(node: LocationNode, parentId: string | null, siblings: LocationNode[]) {
    const isStore = parentId === null;
    const meta =
      node.children.length > 0
        ? t("locations.shelfCount", { count: node.children.length })
        : t("common.itemCount", { count: node.itemCount });
    return (
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {editingId === node.id ? (
          <>
            <Input
              value={editingName}
              autoFocus
              aria-label={t("nameList.renameAria", { name: node.name })}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void rename(node.id, parentId, siblings);
                }
                if (e.key === "Escape") setEditingId(null);
              }}
            />
            <Button size="sm" disabled={busy} onClick={() => void rename(node.id, parentId, siblings)}>
              {t("common.save")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
              {t("common.cancel")}
            </Button>
          </>
        ) : (
          <>
            <span className={`min-w-0 flex-1 truncate ${isStore ? "text-base font-bold" : "text-base font-semibold"}`}>
              <bdi>{node.name}</bdi>
            </span>
            <span className="shrink-0 text-xs text-stencil-muted tabular">{meta}</span>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={t("nameList.renameAria", { name: node.name })}
              onClick={() => {
                setEditingId(node.id);
                setEditingName(node.name);
              }}
            >
              <Pencil aria-hidden />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={t("nameList.deleteAria", { name: node.name })}
              onClick={() => setDeleting(node)}
            >
              <Trash2 aria-hidden />
            </Button>
          </>
        )}
      </div>
    );
  }

  const deletingIsStore = deleting ? !stores.some((s) => s.children.some((c) => c.id === deleting.id)) : false;
  const deletingParentId = deleting
    ? stores.find((s) => s.children.some((c) => c.id === deleting.id))?.id ?? null
    : null;
  const deletingSiblings = deletingParentId
    ? stores.find((s) => s.id === deletingParentId)?.children ?? []
    : stores;

  return (
    <div className="flex max-w-prose flex-col gap-6">
      {stores.length === 0 ? (
        <p className="text-base text-stencil-muted">{t("locations.noStores")}</p>
      ) : (
        <ReorderableList
          items={stores}
          label={t("locations.storesOrder")}
          onReorder={(ids) => void reorder(null, stores, ids)}
          renderRow={(store) => nodeRow(store as LocationNode, null, stores)}
        />
      )}

      {stores.map((store) => (
        <div key={store.id} className="ms-4 flex flex-col gap-2 border-s border-rule-soft ps-4">
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-stencil-muted">
            {t("locations.shelvesIn", { store: store.name })}
          </p>
          {store.children.length > 0 ? (
            <ReorderableList
              items={store.children}
              label={t("locations.shelvesInOrder", { store: store.name })}
              onReorder={(ids) => void reorder(store.id, store.children, ids)}
              renderRow={(shelf) => nodeRow(shelf as LocationNode, store.id, store.children)}
            />
          ) : (
            <p className="text-xs text-stencil-muted">{t("locations.noShelves", { store: store.name })}</p>
          )}
          <AddInput
            placeholder={t("locations.newShelf")}
            disabled={!online}
            onAdd={(name) => add(name, store.id, store.children)}
          />
        </div>
      ))}

      <AddInput placeholder={t("locations.newStore")} disabled={!online} onAdd={(name) => add(name, null, stores)} />

      {error ? (
        <p role="alert" className="border-s-[3px] border-bay-red ps-3 text-base">
          {error}
        </p>
      ) : null}

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("nameList.deleteTitle", { name: deleting?.name })}</DialogTitle>
            <DialogDescription>
              {deletingIsStore && (deleting?.children.length ?? 0) > 0
                ? t("locations.deleteStoreHasShelves")
                : t("settings.deleteNoteLocation")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              {t("common.keepIt")}
            </Button>
            <Button
              variant="destructive"
              disabled={busy || !online}
              onClick={() => deleting && void remove(deleting, deletingParentId, deletingSiblings)}
            >
              {t("nameList.deleteConfirm", { name: deleting?.name })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddInput({
  placeholder,
  disabled,
  onAdd,
}: {
  placeholder: string;
  disabled: boolean;
  onAdd: (name: string) => Promise<boolean>;
}) {
  const t = useT();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const name = value.trim();
        if (!name) return;
        setBusy(true);
        const ok = await onAdd(name);
        setBusy(false);
        if (ok) setValue("");
      }}
    >
      <Input
        value={value}
        aria-label={placeholder}
        placeholder={placeholder}
        maxLength={40}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="submit" disabled={busy || disabled || !value.trim()}>
        {t("common.add")}
      </Button>
    </form>
  );
}
