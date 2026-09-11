"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { api } from "@/lib/fetcher";

export type Option = { id: string; name: string };

type Props = {
  id: string;
  value: string | null;
  options: Option[];
  onChange: (id: string | null) => void;
  onCreated: (option: Option) => void;
  createUrl: string;
  noun: string; // "location", "category"
};

// A native select with one extra choice, "New {noun}", which reveals an input.
// Creating posts straight away so the id exists before the item is saved.
export function CreatableSelect({ id, value, options, onChange, onCreated, createUrl, noun }: Props) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const created = await api<Option>(createUrl, { method: "POST", body: { name } });
      onCreated(created);
      onChange(created.id);
      setCreating(false);
      setName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add it.");
    } finally {
      setBusy(false);
    }
  }

  if (creating) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            id={id}
            value={name}
            placeholder={`New ${noun} name`}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void create();
              }
              if (e.key === "Escape") setCreating(false);
            }}
          />
          <Button type="button" variant="secondary" disabled={busy || !name.trim()} onClick={() => void create()}>
            Add
          </Button>
          <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
            Cancel
          </Button>
        </div>
        {error ? (
          <p role="alert" className="border-l-[3px] border-bay-red pl-3 text-xs">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <NativeSelect
      id={id}
      value={value ?? ""}
      onChange={(e) => {
        if (e.target.value === "__new__") {
          setCreating(true);
          return;
        }
        onChange(e.target.value || null);
      }}
    >
      <option value="">None</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
      <option value="__new__">New {noun}</option>
    </NativeSelect>
  );
}
