// Seeds a realistic storeroom: 2 stores (Store 2 with four shelves), 5
// categories, 25 items, several of them low or out so the running-low strip
// and reorder list have work to do.
// Run with: npm run db:seed
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { stockStatus } from "../src/lib/stock";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Locations nest one level. A store with `shelves` holds no items directly;
// items live on its shelves. A store with no shelves (Store 1) holds items.
const stores: { name: string; shelves: string[] }[] = [
  { name: "Store 1", shelves: [] },
  { name: "Store 2", shelves: ["Shelf A", "Shelf B", "Shelf C", "Shelf D"] },
];
const categories = ["Cleaning", "Paper", "Disposables", "Drinks", "Gloves and bags"];

type SeedItem = {
  name: string;
  description?: string;
  category: string;
  location: string;
  quantity: number;
  unitName: string;
  packSize?: number;
  packName?: string;
  threshold: number;
};

const items: SeedItem[] = [
  // Shelf A: cleaning chemicals
  { name: "Degreaser 5L", description: "Kitchen surfaces and hoods", category: "Cleaning", location: "Shelf A", quantity: 6, unitName: "bottle", packSize: 4, packName: "case", threshold: 3 },
  { name: "Bleach 5L", description: "Floors and drains, dilute 1:50", category: "Cleaning", location: "Shelf A", quantity: 2, unitName: "bottle", packSize: 4, packName: "case", threshold: 3 },
  { name: "Sanitiser spray", description: "Food-safe, 750ml trigger", category: "Cleaning", location: "Shelf A", quantity: 14, unitName: "bottle", packSize: 12, packName: "case", threshold: 6 },
  { name: "Glass cleaner", category: "Cleaning", location: "Shelf A", quantity: 3, unitName: "bottle", threshold: 2 },
  { name: "Oven cleaner", description: "Caustic, gloves required", category: "Cleaning", location: "Shelf A", quantity: 0, unitName: "can", packSize: 6, packName: "case", threshold: 2 },
  { name: "Dishwasher tablets", description: "Commercial rinse-in", category: "Cleaning", location: "Shelf A", quantity: 90, unitName: "tablet", packSize: 100, packName: "box", threshold: 40 },
  { name: "Floor cleaner 5L", category: "Cleaning", location: "Shelf A", quantity: 4, unitName: "bottle", packSize: 4, packName: "case", threshold: 2 },

  // Shelf B: paper and disposables
  { name: "Blue roll", description: "Centrefeed, 2 ply", category: "Paper", location: "Shelf B", quantity: 5, unitName: "roll", packSize: 6, packName: "case", threshold: 6 },
  { name: "Kitchen towel", description: "Single rolls, perforated", category: "Paper", location: "Shelf B", quantity: 24, unitName: "roll", packSize: 24, packName: "case", threshold: 12 },
  { name: "Toilet roll", category: "Paper", location: "Shelf B", quantity: 36, unitName: "roll", packSize: 36, packName: "case", threshold: 18 },
  { name: "Hand towels", description: "Z-fold, for dispensers", category: "Paper", location: "Shelf B", quantity: 8, unitName: "sleeve", packSize: 20, packName: "case", threshold: 10 },
  { name: "Greaseproof sheets", description: "400 x 600", category: "Paper", location: "Shelf B", quantity: 2, unitName: "pack", threshold: 1 },
  { name: "Cling film", description: "300mm x 300m", category: "Disposables", location: "Shelf B", quantity: 3, unitName: "roll", packSize: 6, packName: "case", threshold: 2 },
  { name: "Foil", description: "450mm catering roll", category: "Disposables", location: "Shelf B", quantity: 1, unitName: "roll", threshold: 2 },
  { name: "Takeaway boxes 750ml", category: "Disposables", location: "Shelf B", quantity: 250, unitName: "box", packSize: 250, packName: "case", threshold: 100 },
  { name: "Paper cups 8oz", category: "Disposables", location: "Shelf B", quantity: 40, unitName: "cup", packSize: 50, packName: "sleeve", threshold: 100 },
  { name: "Napkins", description: "Dispenser napkins, white", category: "Disposables", location: "Shelf B", quantity: 3000, unitName: "napkin", packSize: 500, packName: "pack", threshold: 1000 },

  // Under sink: bags and gloves
  { name: "Bin bags 240L", description: "Black, heavy duty", category: "Gloves and bags", location: "Under sink", quantity: 0, unitName: "bag", packSize: 100, packName: "roll", threshold: 20 },
  { name: "Bin bags 90L", description: "Clear recycling", category: "Gloves and bags", location: "Under sink", quantity: 150, unitName: "bag", packSize: 200, packName: "roll", threshold: 50 },
  { name: "Nitrile gloves M", description: "Blue, powder free", category: "Gloves and bags", location: "Under sink", quantity: 120, unitName: "glove", packSize: 100, packName: "box", threshold: 200 },
  { name: "Nitrile gloves L", description: "Blue, powder free", category: "Gloves and bags", location: "Under sink", quantity: 400, unitName: "glove", packSize: 100, packName: "box", threshold: 200 },
  { name: "Scourers", category: "Cleaning", location: "Under sink", quantity: 18, unitName: "pad", packSize: 10, packName: "pack", threshold: 10 },

  // Walk-in door: drinks
  { name: "Still water 500ml", category: "Drinks", location: "Walk-in door", quantity: 22, unitName: "bottle", packSize: 24, packName: "case", threshold: 24 },
  { name: "Sparkling water 500ml", category: "Drinks", location: "Walk-in door", quantity: 48, unitName: "bottle", packSize: 24, packName: "case", threshold: 24 },
  { name: "Cola cans", description: "330ml", category: "Drinks", location: "Walk-in door", quantity: 6, unitName: "can", packSize: 24, packName: "case", threshold: 24 },
];

// Items were authored against a flat list of shelves. Remap each to a leaf in
// the new store/shelf tree. Leaves are addressed by path: "Store 1" (a store
// with no shelves) or "Store 2/Shelf A" (a shelf under a store).
function leafPath(item: SeedItem): string {
  if (item.location === "Shelf A") return "Store 2/Shelf A";
  if (item.location === "Shelf B") return item.category === "Paper" ? "Store 2/Shelf B" : "Store 2/Shelf C";
  if (item.location === "Under sink") return "Store 1";
  if (item.location === "Walk-in door") return "Store 2/Shelf D";
  return item.location;
}

async function main() {
  await prisma.reorderEntry.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
  await prisma.location.deleteMany();

  // Path ("Store 1" or "Store 2/Shelf A") -> location id, for item assignment.
  const leafIds = new Map<string, string>();
  for (const [i, store] of stores.entries()) {
    const storeRow = await prisma.location.create({ data: { name: store.name, sortOrder: i } });
    if (store.shelves.length === 0) {
      leafIds.set(store.name, storeRow.id); // the store itself is the leaf
    }
    for (const [j, shelf] of store.shelves.entries()) {
      const shelfRow = await prisma.location.create({
        data: { name: shelf, sortOrder: j, parentId: storeRow.id },
      });
      leafIds.set(`${store.name}/${shelf}`, shelfRow.id);
    }
  }
  const categoryIds = new Map<string, string>();
  for (const [i, name] of categories.entries()) {
    const row = await prisma.category.create({ data: { name, sortOrder: i } });
    categoryIds.set(name, row.id);
  }

  const perLocation = new Map<string, number>();
  for (const item of items) {
    const path = leafPath(item);
    const sortOrder = perLocation.get(path) ?? 0;
    perLocation.set(path, sortOrder + 1);
    const created = await prisma.item.create({
      data: {
        name: item.name,
        description: item.description,
        categoryId: categoryIds.get(item.category),
        locationId: leafIds.get(path),
        quantity: item.quantity,
        unitName: item.unitName,
        packSize: item.packSize,
        packName: item.packName,
        threshold: item.threshold,
        sortOrder,
        movements: {
          create: { type: "COUNT", delta: item.quantity, quantityAfter: item.quantity, note: "Opening count" },
        },
      },
    });
    if (stockStatus(created) !== "ok") {
      const requestedQty = Math.max(item.threshold * 2 - item.quantity, item.packSize ?? 1);
      await prisma.reorderEntry.create({ data: { itemId: created.id, requestedQty, addedAuto: true } });
    }
  }

  const count = await prisma.item.count();
  const locationCount = await prisma.location.count();
  console.log(`Seeded ${count} items across ${locationCount} locations and ${categories.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
