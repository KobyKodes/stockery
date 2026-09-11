"use client";

import { useState, type DragEvent } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export type Reorderable = { id: string; name: string };

type Props<T extends Reorderable> = {
  items: T[];
  onReorder: (ids: string[]) => void;
  renderRow: (item: T) => React.ReactNode;
  label: string;
};

// Drag to reorder, with keyboard moves for anyone not using a pointer.
// Reordering is committed by the caller as soon as a row lands.
export function ReorderableList<T extends Reorderable>({ items, onReorder, renderRow, label }: Props<T>) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function move(fromId: string, toId: string) {
    if (fromId === toId) return;
    const ids = items.map((i) => i.id);
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(toId);
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ...ids.splice(from, 1));
    onReorder(ids);
  }

  function nudge(id: string, direction: -1 | 1) {
    const ids = items.map((i) => i.id);
    const from = ids.indexOf(id);
    const to = from + direction;
    if (to < 0 || to >= ids.length) return;
    ids.splice(to, 0, ...ids.splice(from, 1));
    onReorder(ids);
  }

  function onDrop(e: DragEvent, id: string) {
    e.preventDefault();
    if (draggingId) move(draggingId, id);
    setDraggingId(null);
    setOverId(null);
  }

  return (
    <ul aria-label={label}>
      {items.map((item) => (
        <li
          key={item.id}
          onDragOver={(e) => {
            e.preventDefault();
            setOverId(item.id);
          }}
          onDrop={(e) => onDrop(e, item.id)}
          className={cn(
            "flex items-center gap-3 rule-hair py-2",
            draggingId === item.id && "opacity-50",
            overId === item.id && draggingId && draggingId !== item.id && "bg-paper",
          )}
        >
          <button
            type="button"
            draggable
            onDragStart={() => setDraggingId(item.id)}
            onDragEnd={() => {
              setDraggingId(null);
              setOverId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                nudge(item.id, -1);
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                nudge(item.id, 1);
              }
            }}
            aria-label={`Move ${item.name}. Use the arrow keys.`}
            className="flex size-tap shrink-0 cursor-grab items-center justify-center text-stencil-muted"
          >
            <GripVertical aria-hidden className="size-5" />
          </button>
          {renderRow(item)}
        </li>
      ))}
    </ul>
  );
}
