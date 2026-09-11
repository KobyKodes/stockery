// Copies every row from one Stockery database into another - the local
// storeroom you built up by hand, into the deployed one on Neon.
//
//   SOURCE_DATABASE_URL=... TARGET_DATABASE_URL=... npx tsx scripts/copy-data.ts
//
// Both databases must already be on the same migration (the target gets there
// through `prisma migrate deploy` in the Render build).
//
// Rows are written by id, so running it twice changes nothing the second time:
// an id already in the target is updated, not duplicated. Pass --wipe to empty
// the target's tables first, when the deployed copy holds test data that
// should not survive.
import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const wipe = process.argv.includes("--wipe");
const dryRun = process.argv.includes("--dry-run");

function client(url: string) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

async function main() {
  const sourceUrl = required("SOURCE_DATABASE_URL");
  const targetUrl = required("TARGET_DATABASE_URL");
  if (sourceUrl === targetUrl) throw new Error("source and target are the same database");

  const source = client(sourceUrl);
  const target = client(targetUrl);

  try {
    const categories = await source.category.findMany();
    // Parents before children: a shelf's parentId must already exist.
    const locations = await source.location.findMany({ orderBy: [{ parentId: { sort: "asc", nulls: "first" } }] });
    const items = await source.item.findMany();
    const movements = await source.stockMovement.findMany();
    const reorder = await source.reorderEntry.findMany();
    const settings = await source.setting.findMany();

    console.log(
      `source: ${categories.length} categories, ${locations.length} locations, ${items.length} items, ` +
        `${movements.length} movements, ${reorder.length} reorder entries, ${settings.length} settings`,
    );

    const before = await counts(target);
    console.log("target before:", before);

    if (dryRun) {
      console.log("--dry-run: nothing written");
      return;
    }

    if (wipe) {
      // Children first; the schema restricts deleting a location that still
      // has shelves under it.
      await target.stockMovement.deleteMany();
      await target.reorderEntry.deleteMany();
      await target.item.deleteMany();
      await target.location.deleteMany({ where: { parentId: { not: null } } });
      await target.location.deleteMany();
      await target.category.deleteMany();
      await target.setting.deleteMany();
      console.log("target emptied");
    }

    for (const row of categories) {
      await target.category.upsert({ where: { id: row.id }, create: row, update: row });
    }
    for (const row of locations) {
      await target.location.upsert({ where: { id: row.id }, create: row, update: row });
    }
    for (const row of items) {
      await target.item.upsert({ where: { id: row.id }, create: row, update: row });
    }
    for (const row of movements) {
      await target.stockMovement.upsert({ where: { id: row.id }, create: row, update: row });
    }
    for (const row of reorder) {
      await target.reorderEntry.upsert({ where: { id: row.id }, create: row, update: row });
    }
    for (const row of settings) {
      // A JSON column holding literal null needs Prisma's marker, not null.
      const value = row.value === null ? Prisma.JsonNull : row.value;
      await target.setting.upsert({
        where: { key: row.key },
        create: { key: row.key, value },
        update: { value },
      });
    }

    const after = await counts(target);
    console.log("target after: ", after);
  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }
}

async function counts(db: PrismaClient) {
  const [categories, locations, items, movements, reorder, settings] = await Promise.all([
    db.category.count(),
    db.location.count(),
    db.item.count(),
    db.stockMovement.count(),
    db.reorderEntry.count(),
    db.setting.count(),
  ]);
  return { categories, locations, items, movements, reorder, settings };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
