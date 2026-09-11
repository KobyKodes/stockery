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
import { useI18n } from "@/lib/i18n/client";
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

function initial(item: ItemRow | undefined, defaultUnit: string, defaultPack: string): FormState {
  return {
    name: item?.name ?? "",
    description: item?.description ?? "",
    categoryId: item?.category?.id ?? null,
    locationId: item?.location?.id ?? null,
    unitName: item?.unitName ?? defaultUnit,
    hasPacks: !!item?.packSize,
    packName: item?.packName ?? defaultPack,
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
  const { locale, t } = useI18n();
  const [form, setForm] = useState<FormState>(() =>
    initial(item, t("form.defaultUnit"), t("form.defaultPack")),
  );
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
      setError(e instanceof Error ? e.message : t("form.photoFailed"));
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
      toast(t("common.saved"));
      router.push(item ? `/items/${id}` : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("form.saveFailed"));
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!item) return;
    setBusy(true);
    try {
      await api(`/api/items/${item.id}`, { method: "DELETE" });
      toast(t("form.deletedToast", { name: item.name }));
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("form.deleteFailed"));
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-prose flex-col gap-6" noValidate>
      <div className="flex flex-col gap-1">
        <Label htmlFor="name">{t("form.name")}</Label>
        <Input id="name" required maxLength={80} value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus={!item} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="description">{t("form.description")}</Label>
        <Textarea
          id="description"
          maxLength={200}
          rows={2}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
        <p className="text-xs text-stencil-muted tabular">
          {t("form.descriptionCount", { count: form.description.length })}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="location">{t("form.location")}</Label>
          <CreatableSelect
            id="location"
            kind="location"
            value={form.locationId}
            options={locations}
            onChange={(v) => set("locationId", v)}
            onCreated={(o) => setLocations((l) => [...l, o])}
            createUrl="/api/locations"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="category">{t("form.category")}</Label>
          <CreatableSelect
            id="category"
            kind="category"
            value={form.categoryId}
            options={categories}
            onChange={(v) => set("categoryId", v)}
            onCreated={(o) => setCategories((c) => [...c, o])}
            createUrl="/api/categories"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="unitName">{t("form.unitName")}</Label>
        <Input id="unitName" className="w-48" maxLength={30} value={form.unitName} onChange={(e) => set("unitName", e.target.value)} />
        <p className="text-xs text-stencil-muted">{t("form.unitHint")}</p>
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="hasPacks" className="cursor-pointer">
          <Switch id="hasPacks" checked={form.hasPacks} onCheckedChange={(v) => set("hasPacks", v)} />
          {t("form.hasPacks")}
        </Label>
        {form.hasPacks ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="packName">{t("form.packName")}</Label>
              <Input id="packName" className="w-36" maxLength={30} value={form.packName} onChange={(e) => set("packName", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="packSize">
                {t("form.packSize", {
                  unit: pluralise(form.unitName || t("form.unitFallback"), 2, locale),
                  pack: form.packName || t("form.packFallback"),
                })}
              </Label>
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
        <Label htmlFor="quantity">{t("form.quantity")}</Label>
        <PackEntry
          id="quantity"
          value={form.quantity}
          onChange={(v) => set("quantity", v)}
          unitName={form.unitName || t("form.unitFallback")}
          packSize={packSize}
          packName={packName}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="threshold">{t("form.threshold")}</Label>
        <PackEntry
          id="threshold"
          value={form.threshold}
          onChange={(v) => set("threshold", v)}
          unitName={form.unitName || t("form.unitFallback")}
          packSize={packSize}
          packName={packName}
        />
        <p className="text-xs text-stencil-muted">
          {t("form.thresholdHint", {
            count: form.threshold,
            unit: pluralise(form.unitName || t("form.unitFallback"), form.threshold === 1 ? 1 : 2, locale),
          })}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold">{t("form.photo")}</span>
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
              {t("form.addPhoto")}
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
              {preview ? t("form.changePhoto") : t("form.choosePhoto")}
            </Button>
            {preview ? (
              <Button type="button" variant="ghost" size="sm" onClick={removePhoto}>
                <X aria-hidden />
                {t("form.removePhoto")}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="border-s-[3px] border-bay-red ps-3 text-base">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rule-hair pt-4">
        <Button type="submit" disabled={busy || !online}>
          {busy ? t("common.saving") : t("form.submit")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          {t("common.cancel")}
        </Button>
        {item ? (
          <Button type="button" variant="link" className="ms-auto text-bay-red" onClick={() => setConfirmDelete(true)}>
            {t("form.deleteItem")}
          </Button>
        ) : null}
      </div>

      {item ? (
        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("form.deleteTitle", { name: item.name })}</DialogTitle>
              <DialogDescription>{t("form.deleteBody")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
                {t("common.keepIt")}
              </Button>
              <Button type="button" variant="destructive" disabled={busy || !online} onClick={() => void onDelete()}>
                {t("form.deleteConfirm", { name: item.name })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </form>
  );
}
