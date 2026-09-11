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

/// Catches the string that is not a connection string at all - a placeholder
/// left unreplaced, a fragment of a pasted command - before Prisma reports it
/// three steps later as an unreachable host with a nonsense name.
function connectionString(name: string): string {
  const value = required(name);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} is not a connection string: ${JSON.stringify(value.slice(0, 40))}...`);
  }
  if (!/^postgres(ql)?:$/.test(url.protocol)) {
    throw new Error(`${name} must start with postgresql:// - got ${url.protocol}//`);
  }
  if (!url.hostname) throw new Error(`${name} has no host`);
  return value;
}

/// Which database this string actually reaches, with the password left out.
/// Neon puts the branch in the hostname (ep-xxx...), so this is what to
/// compare against DATABASE_URL in the Render dashboard: copying into the
/// right-looking URL for the wrong branch leaves the deployed app empty.
function describe(url: string): string {
  try {
    const { hostname, port, pathname, username } = new URL(url);
    return `${username}@${hostname}${port ? `:${port}` : ""}${pathname}`;
  } catch {
    return "<unparseable connection string>";
  }
}

async function main() {
  const sourceUrl = connectionString("SOURCE_DATABASE_URL");
  const targetUrl = connectionString("TARGET_DATABASE_URL");
  if (sourceUrl === targetUrl) throw new Error("source and target are the same database");

  console.log("source:", describe(sourceUrl));
  console.log("target:", describe(targetUrl));

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

    // Ask the target itself what it is, rather than trusting the string.
    const [identity] = await target.$queryRaw<{ db: string; user: string }[]>`
      select current_database() as db, current_user as "user"`;
    console.log(`target reports: database ${identity.db}, user ${identity.user}`);

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
