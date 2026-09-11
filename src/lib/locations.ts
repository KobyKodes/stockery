import "server-only";
import { prisma } from "@/lib/prisma";

// Server-side helpers for the location tree. Locations nest one level (a store
// holds shelves), but these helpers recurse so a deeper tree would still work.

export type LocationNode = {
  id: string;
  name: string;
  sortOrder: number;
  parentId: string | null;
  itemCount: number;
  children: LocationNode[];
};

const bySibling = (a: LocationNode, b: LocationNode) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

/** The full location forest: top-level stores, each with its shelves, sorted. */
export async function getLocationTree(): Promise<LocationNode[]> {
  const rows = await prisma.location.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, sortOrder: true, parentId: true, _count: { select: { items: true } } },
  });
  const nodes = new Map<string, LocationNode>();
  for (const r of rows) {
    nodes.set(r.id, {
      id: r.id,
      name: r.name,
      sortOrder: r.sortOrder,
      parentId: r.parentId,
      itemCount: r._count.items,
      children: [],
    });
  }
  const roots: LocationNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const sortRec = (list: LocationNode[]) => {
    list.sort(bySibling);
    for (const n of list) sortRec(n.children);
  };
  sortRec(roots);
  return roots;
}

/** Every node, flattened. */
export function flattenTree(roots: LocationNode[]): LocationNode[] {
  const out: LocationNode[] = [];
  const walk = (n: LocationNode) => {
    out.push(n);
    n.children.forEach(walk);
  };
  roots.forEach(walk);
  return out;
}

/** Leaf ids in walk order (depth-first). A leaf is a node with no children. */
export function leafOrder(roots: LocationNode[]): string[] {
  const out: string[] = [];
  const walk = (n: LocationNode) => {
    if (n.children.length === 0) out.push(n.id);
    else n.children.forEach(walk);
  };
  roots.forEach(walk);
  return out;
}

/**
 * The leaf ids a location filter should match. A leaf matches itself; a
 * branch (a store with shelves) matches all of its descendant leaves.
 */
export function descendantLeafIds(roots: LocationNode[], id: string): string[] {
  const node = flattenTree(roots).find((n) => n.id === id);
  if (!node) return [id];
  if (node.children.length === 0) return [node.id];
  const out: string[] = [];
  const walk = (n: LocationNode) => {
    if (n.children.length === 0) out.push(n.id);
    else n.children.forEach(walk);
  };
  node.children.forEach(walk);
  return out;
}

/** True if the location can hold items directly (it exists and has no children). */
export function isAssignableLeaf(roots: LocationNode[], id: string): boolean {
  const node = flattenTree(roots).find((n) => n.id === id);
  return !!node && node.children.length === 0;
}

export type LocationOption = { id: string; name: string; isLeaf: boolean; depth: number };

/** Depth-first options with a path label, for filters and the item form. */
export function locationOptions(roots: LocationNode[], leavesOnly = false): LocationOption[] {
  const out: LocationOption[] = [];
  const walk = (n: LocationNode, prefix: string, depth: number) => {
    const label = prefix ? `${prefix} › ${n.name}` : n.name;
    const isLeaf = n.children.length === 0;
    if (!leavesOnly || isLeaf) out.push({ id: n.id, name: label, isLeaf, depth });
    n.children.forEach((c) => walk(c, label, depth + 1));
  };
  roots.forEach((r) => walk(r, "", 0));
  return out;
}
