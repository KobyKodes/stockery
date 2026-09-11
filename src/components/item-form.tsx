"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";
import { useOnline } from "@/components/offline-banner";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CreatableSelect, type Option } from "@/components/creatable-select";
import { PackEntry } from "@/components/pack-entry";
import { useToast } from "@/components/toaster";
import { api } from "@/lib/fetcher";
import { itemImageUrl, resizeImage } from "@/lib/image";
import type { ItemRow } from "@/lib/item-view";
import { pluralise } from "@/lib/stock";

type Props = {
  item?: ItemRow;
  categories: Option[];
  locations: Option[];
};

type FormState = {
  name: string;
  description: string;
  categoryId: string | null;
  locationId: string | null;
  unitName: string;
  hasPacks: boolean;
  packName: string;
  packSize: number;
  quantity: number;
  threshold: number;
};

function initial(item?: ItemRow): FormState {
  return {
    name: item?.name ?? "",
    description: item?.description ?? "",
    categoryId: item?.category?.id ?? null,
    locationId: item?.location?.id ?? null,
    unitName: item?.unitName ?? "each",
    hasPacks: !!item?.packSize,
    packName: item?.packName ?? "case",
    packSize: item?.packSize ?? 12,
    quantity: item?.quantity ?? 0,
    threshold: item?.threshold ?? 0,
  };
}

// One form for create and edit. Quantities are entered as packs + units when
// the item is sold in packs; the request always carries base units.
export function ItemForm({ item, categories: initialCategories, locations: initialLocations }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(() => initial(item));
  const [categories, setCategories] = useState(initialCategories);
  const [locations, setLocations] = useState(initialLocations);
  const [busy, setBusy] = useState(false);
  const online = useOnline();
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Photo: null = unchanged, "remove" = delete on save, Blob = upload on save.
  const [photo, setPhoto] = useState<Blob | "remove" | null>(null);
  const [preview, setPreview] = useState<string | null>(item?.hasImage ? itemImageUrl(item.id, item.imageVersion) : null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const packSize = form.hasPacks ? form.packSize : null;
  const packName = form.hasPacks ? form.packName : null;

  async function choosePhoto(file: File | undefined) {
    if (!file) return;
    try {
      const blob = await resizeImage(file);
      setPhoto(blob);
      setPreview(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : "That photo couldn't be used.");
    }
  }

  function removePhoto() {
    setPhoto(item?.hasImage ? "remove" : null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = {
      name: form.name,
      description: form.description,
      categoryId: form.categoryId,
      locationId: form.locationId,
      unitName: form.unitName,
      packSize,
      packName,
      quantity: form.quantity,
      threshold: form.threshold,
    };
    try {
      const saved = item
        ? await api<{ item: ItemRow }>(`/api/items/${item.id}`, { method: "PATCH", body })
        : await api<{ item: ItemRow }>("/api/items", { method: "POST", body });
      const id = saved.item.id;
      if (photo === "remove") {
        await api(`/api/items/${id}/image`, { method: "DELETE" });
      } else if (photo) {
        const fd = new FormData();
        fd.append("image", photo, "photo.jpg");
        await api(`/api/items/${id}/image`, { method: "PUT", body: fd });
      }
      toast("Saved");
      router.push(item ? `/items/${id}` : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save. Try again.");
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!item) return;
    setBusy(true);
    try {
      await api(`/api/items/${item.id}`, { method: "DELETE" });
      toast(`Deleted ${item.name}`);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete. Try again.");
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-prose flex-col gap-6" noValidate>
      <div className="flex flex-col gap-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" required maxLength={80} value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus={!item} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          maxLength={200}
          rows={2}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
        <p className="text-xs text-stencil-muted tabular">{form.description.length} of 200</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="location">Location</Label>
          <CreatableSelect
            id="location"
            noun="location"
            value={form.locationId}
            options={locations}
            onChange={(v) => set("locationId", v)}
            onCreated={(o) => setLocations((l) => [...l, o])}
            createUrl="/api/locations"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="category">Category</Label>
          <CreatableSelect
            id="category"
            noun="category"
            value={form.categoryId}
            options={categories}
            onChange={(v) => set("categoryId", v)}
            onCreated={(o) => setCategories((c) => [...c, o])}
            createUrl="/api/categories"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="unitName">One of these is called a</Label>
        <Input id="unitName" className="w-48" maxLength={30} value={form.unitName} onChange={(e) => set("unitName", e.target.value)} />
        <p className="text-xs text-stencil-muted">bag, roll, bottle, each</p>
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="hasPacks" className="cursor-pointer">
          <Switch id="hasPacks" checked={form.hasPacks} onCheckedChange={(v) => set("hasPacks", v)} />
          Sold in packs
        </Label>
        {form.hasPacks ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="packName">Pack name</Label>
              <Input id="packName" className="w-36" maxLength={30} value={form.packName} onChange={(e) => set("packName", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="packSize">{pluralise(form.unitName || "unit", 2)} per {form.packName || "pack"}</Label>
              <Input
                id="packSize"
                type="number"
                inputMode="numeric"
                min={2}
                step={1}
                className="w-28"
                value={form.packSize}
                onChange={(e) => set("packSize", Math.max(0, Math.floor(Number(e.target.value))))}
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="quantity">On hand now</Label>
        <PackEntry
          id="quantity"
          value={form.quantity}
          onChange={(v) => set("quantity", v)}
          unitName={form.unitName || "unit"}
          packSize={packSize}
          packName={packName}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="threshold">Warn when down to</Label>
        <PackEntry
          id="threshold"
          value={form.threshold}
          onChange={(v) => set("threshold", v)}
          unitName={form.unitName || "unit"}
          packSize={packSize}
          packName={packName}
        />
        <p className="text-xs text-stencil-muted">
          You&apos;ll be warned when {form.threshold} or fewer {pluralise(form.unitName || "unit", form.threshold === 1 ? 1 : 2)} are left.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold">Photo</span>
        <div className="flex items-start gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-24 bg-paper object-cover" />
          ) : (
            <label
              htmlFor="photo"
              className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-stencil-muted text-xs text-stencil-muted"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void choosePhoto(e.dataTransfer.files[0]);
              }}
            >
              <Camera aria-hidden className="size-5" />
              Add photo
            </label>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              id="photo"
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => void choosePhoto(e.target.files?.[0])}
            />
            <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              {preview ? "Change photo" : "Choose photo"}
            </Button>
            {preview ? (
              <Button type="button" variant="ghost" size="sm" onClick={removePhoto}>
                <X aria-hidden />
                Remove photo
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="border-l-[3px] border-bay-red pl-3 text-base">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rule-hair pt-4">
        <Button type="submit" disabled={busy || !online}>
          {busy ? "Saving" : "Save item"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        {item ? (
          <Button type="button" variant="link" className="ml-auto text-bay-red" onClick={() => setConfirmDelete(true)}>
            Delete item
          </Button>
        ) : null}
      </div>

      {item ? (
        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {item.name}?</DialogTitle>
              <DialogDescription>
                It leaves the storeroom list and the reorder list, and its history goes with it.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Keep it
              </Button>
              <Button type="button" variant="destructive" disabled={busy || !online} onClick={() => void onDelete()}>
                Delete {item.name}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </form>
  );
}
