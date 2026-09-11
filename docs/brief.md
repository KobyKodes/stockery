# Build "Stockery": a work-kitchen storeroom inventory app

You are a senior full-stack engineer with strong product-design instincts. You are building a small, production-quality web app from an empty folder. Read this entire brief before writing any code. Every decision below has already been made with the client; do not re-litigate them, but do flag anything that turns out to be technically impossible.

## 1. What this is

Stockery tracks every item in a commercial kitchen's dry-goods storeroom: cleaning chemicals, paper goods, garbage bags, gloves, drinks, disposables. One person (the client) manages it from a phone while standing in the storeroom, and occasionally from a laptop. Items leave the storeroom every day, so the single most-used action is "I just took 5 of these". Once in a while the client walks the shelves and enters actual on-hand counts for everything. The app must warn when anything is running low, using a per-item threshold the client sets.

It will live on GitHub and deploy to Render's free tier. It is also a portfolio piece for a software engineer, so code quality, README, and visual craft all matter.

Non-goals for v1: multi-user accounts, offline sync, email or push notifications, barcode scanning, supplier ordering integrations.

## 2. Stack (fixed, do not substitute)

This mirrors the client's existing `employee-tracker` project so they can maintain both the same way.

- **Next.js (latest, App Router, TypeScript)** as one app for UI and API. One Render web service, no separate backend to keep alive.
- **Route handlers under `src/app/api/**`** for all data access. Server Components read via Prisma directly; mutations go through route handlers so the API is inspectable and testable.
- **Prisma 7 with `@prisma/adapter-pg` and `pg`** against **Postgres on Neon** (free tier, does not expire like Render's free Postgres). Migrations checked into `prisma/migrations`.
- **next-auth v5 (beta) with the Credentials provider**, single admin whose `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` (bcryptjs, cost 12) live in env vars. JWT session. A `src/proxy.ts` (Next's middleware equivalent) redirects unauthenticated requests to `/login`. Include `scripts/hash-password.mjs` that prints the hash.
- **Tailwind CSS v4** via `@tailwindcss/postcss`, with the design tokens declared in `@theme` inside `globals.css`. Tokens first, utilities second.
- **shadcn** components generated into `src/components/ui`, restyled through the tokens so nothing looks like stock shadcn. Use `@base-ui/react` primitives as the shadcn base if the current shadcn CLI supports it, otherwise Radix.
- **lucide-react** for icons, **date-fns** for dates, **class-variance-authority + clsx + tailwind-merge** for variants.
- **Images stored as `Bytes` in Postgres**, resized in the browser to max 512px JPEG before upload (see `resizeImage` pattern below). Served through `GET /api/items/[id]/image` with cache headers. No S3, no external storage.
- **Zod** for validating every request body in route handlers.
- **Vitest** for unit tests of the pure logic (stock math, pack conversion, status derivation). No E2E framework required in v1.
- **ESLint (eslint-config-next)** and `tsc --noEmit` must pass before every phase is declared done.

Before writing any Next.js code, read `node_modules/next/dist/docs/` for the installed version. The App Router APIs may differ from what you remember. Heed deprecation notices.

## 3. Before any UI: invoke the frontend-design skill

Run the `frontend-design` skill (via the Skill tool) before writing a single component. Follow its two-pass process:

1. Write a compact design plan to `docs/design-plan.md`: 4 to 6 named hex colors, typefaces with roles, layout concept with ASCII wireframes for the list screen and the take flow, alignment rules, and principles.
2. Review that plan against this brief and against the skill's list of generic tells. Rewrite anything that reads as a default. Record what you changed and why in the same file.

At the top of `docs/design-plan.md`, include a section titled **"Decisions taken from the frontend-design skill"** listing, as bullets, every concrete choice that came from the skill (for example: single type family with a distinct display weight, one memorable element, borders only where they encode information, motion only in response to user action, sentence-case copy, tabular figures instead of monospace for numbers). This list is part of the deliverable; the client will read it.

One deliberate override of the skill, already agreed with the client: uppercase type is permitted for exactly two things, the "STOCKERY" wordmark and the location/aisle group headings in the item list, because the whole direction is built on warehouse signage where that is the vernacular. Everywhere else, sentence case. No uppercase tracked-out eyebrow labels, no uppercase buttons, no uppercase form labels. State this override in the design plan.

## 4. Visual direction: "Receiving Dock"

The storeroom is a small warehouse. The design borrows from warehouse aisle signage, delivery-bay stencils, airport baggage-hall wayfinding, and IKEA's self-serve warehouse level. Reference points: the big black-on-yellow bay numbers at a loading dock; Barlow Condensed on a shipping label; the heavy black rules that separate aisles on a warehouse map.

**Palette** (starting point; refine in the design plan but stay in this family):

| Token | Hex | Role |
|---|---|---|
| concrete | `#E9E7E1` | page background. A real warm grey, not white, not cream. |
| stencil | `#14181C` | primary text and heavy rules. Not `#000`, not `#111`; this is a blue-black chosen on purpose. |
| safety | `#FFC72C` | the one accent. Primary action, active states, the low-stock signal. |
| bay-red | `#D7263D` | out of stock and destructive actions only. |
| steel | `#4A6FA5` | links, secondary interactive, focus rings. |
| paper | `#F7F6F2` | raised surfaces (sheets, dialogs, table rows on hover). |

Verify every text/background pair against WCAG AA at the sizes used. Stencil on safety must pass for buttons; if it doesn't at small sizes, bump the size rather than the color.

**Type:** Barlow Condensed for the wordmark, headings, and every quantity numeral. Barlow for body, labels, and table text. Both from Google Fonts via `next/font/google`, weights 400/600/700 only. Enable `font-variant-numeric: tabular-nums` on every numeric cell so columns align without using a monospace face. Type scale following Bringhurst: 14 / 16 / 20 / 28 / 44 / 72px, tight leading on display sizes. Line length under 80 characters in any prose.

**Layout:** left-aligned throughout. Heavy 3px stencil rules separate location groups in the list (they encode "new shelf", they are not decoration). 1px rules between rows. Zero border-radius on rules and tables; 4px on inputs and buttons; nothing larger. Shadows only on the take sheet and dialogs, and only one shadow value.

**The one bold element:** the quantity numeral. It is set in Barlow Condensed at 44px on desktop rows and 72px in the take sheet, readable from arm's length on a phone in a dim storeroom. Everything else on the screen stays quiet so the numbers carry the page. Do not spend boldness anywhere else: no hero, no gradient, no illustration.

**Motion:** exactly one page-load moment (the low-stock strip counts up its total once). Every other animation responds to a user action: the numeral rolls to its new value after a take, the row flashes safety yellow for 400ms after a change, the take sheet slides up. Respect `prefers-reduced-motion`.

**Avoid** (from the frontend-design skill, and specifically for this brief): cream backgrounds with serif headlines and terracotta accents; near-black backgrounds with one neon accent; the SaaS card kit of identical rounded cards with soft grey shadows; middle-dot meta strings; monospace for data labels; arrows appended to buttons; hover transitions on every element; numbered step markers where nothing is a sequence.

## 5. Design token layer (write this FIRST, before any component)

Phase 0 ends with `src/app/globals.css` containing a complete `@theme` block and a `/tokens` dev-only route that renders every token so it can be screenshotted. Do not write a single component until this exists and has been reviewed.

```css
@import "tailwindcss";

@theme {
  /* color */
  --color-concrete: #E9E7E1;
  --color-paper: #F7F6F2;
  --color-stencil: #14181C;
  --color-stencil-muted: #4B5259;
  --color-safety: #FFC72C;
  --color-safety-deep: #E0A800;
  --color-bay-red: #D7263D;
  --color-steel: #4A6FA5;
  --color-rule: #14181C;
  --color-rule-soft: #C9C6BE;

  /* semantic stock status */
  --color-status-ok: var(--color-stencil);
  --color-status-low: var(--color-safety);
  --color-status-out: var(--color-bay-red);

  /* type */
  --font-display: "Barlow Condensed", "Arial Narrow", sans-serif;
  --font-body: "Barlow", "Helvetica Neue", Arial, sans-serif;
  --text-xs: 0.875rem;   /* 14 */
  --text-base: 1rem;     /* 16 */
  --text-lg: 1.25rem;    /* 20 */
  --text-xl: 1.75rem;    /* 28 */
  --text-2xl: 2.75rem;   /* 44 */
  --text-3xl: 4.5rem;    /* 72 */
  --leading-display: 0.95;
  --leading-body: 1.45;

  /* space (4px base) */
  --spacing-1: 4px;  --spacing-2: 8px;  --spacing-3: 12px;
  --spacing-4: 16px; --spacing-6: 24px; --spacing-8: 32px;
  --spacing-12: 48px;

  /* rules and radius */
  --rule-heavy: 3px;
  --rule-hair: 1px;
  --radius-control: 4px;
  --radius-none: 0px;

  /* elevation: one value only */
  --shadow-sheet: 0 -8px 24px rgba(20, 24, 28, 0.18);

  /* layout */
  --width-content: 72rem;
  --height-row: 56px;       /* desktop table row */
  --height-row-touch: 64px; /* mobile row, thumb-safe */
  --height-tap: 44px;       /* minimum tap target */

  /* motion */
  --duration-fast: 120ms;
  --duration-base: 220ms;
  --duration-roll: 400ms;
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root { --duration-fast: 0ms; --duration-base: 0ms; --duration-roll: 0ms; }
}
```

Rules for the token layer:
- Every color in a component comes from a token. Grep for raw hex in `src/components` and `src/app` must return nothing at the end of every phase.
- Status colors are only ever referenced through the `--color-status-*` semantic tokens, so the meaning of "low" can be retuned in one place.
- shadcn's default CSS variables (`--background`, `--primary`, etc.) must be mapped onto these tokens in `globals.css`, not left at their defaults.

## 6. Data model

Store all quantities in **base units** (the smallest thing you'd hand someone: one bag, one roll, one bottle). Pack size is a display and entry convenience, never a second source of truth.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  sortOrder Int      @default(0)
  items     Item[]
  createdAt DateTime @default(now())
}

/// A physical place: "Shelf A", "Under sink", "Walk-in door". Drives the
/// walk order during a full count, so sortOrder matters.
model Location {
  id        String   @id @default(cuid())
  name      String   @unique
  sortOrder Int      @default(0)
  items     Item[]
  createdAt DateTime @default(now())
}

model Item {
  id          String    @id @default(cuid())
  name        String
  description String?                     // optional, short; UI caps at 200 chars
  categoryId  String?
  locationId  String?
  category    Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  location    Location? @relation(fields: [locationId], references: [id], onDelete: SetNull)

  quantity    Int       @default(0)       // always in base units, never negative
  unitName    String    @default("each")  // "bag", "roll", "bottle", "each"
  packSize    Int?                        // e.g. 12 if a case holds 12; null = no packs
  packName    String?                     // "case", "box", "sleeve"
  threshold   Int       @default(0)       // low when quantity <= threshold (base units)

  image       Bytes?
  imageType   String?                     // "image/jpeg"

  sortOrder   Int       @default(0)       // manual order within a location
  archived    Boolean   @default(false)   // soft delete; hard delete also allowed
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  movements   StockMovement[]
  reorder     ReorderEntry?

  @@index([locationId, sortOrder])
  @@index([categoryId])
}

/// Every change to quantity is a movement. Needed for undo, for "received"
/// on the reorder list, and for a history view later. History UI is out of
/// scope for v1 but the data must exist from day one.
model StockMovement {
  id            String       @id @default(cuid())
  itemId        String
  item          Item         @relation(fields: [itemId], references: [id], onDelete: Cascade)
  type          MovementType
  delta         Int                          // signed, base units
  quantityAfter Int                          // denormalised for cheap history reads
  note          String?
  createdAt     DateTime     @default(now())

  @@index([itemId, createdAt])
}

enum MovementType {
  TAKE      // daily removal
  RECEIVE   // delivery / restock
  COUNT     // absolute count overwrite; delta = counted - previous
  ADJUST    // manual edit of quantity in the item form
}

/// One row per item currently on the reorder list. Low-stock items are
/// added automatically; the client can add or remove any item manually.
model ReorderEntry {
  id           String   @id @default(cuid())
  itemId       String   @unique
  item         Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)
  requestedQty Int                     // base units to order; defaults to threshold*2 - quantity, min packSize
  checked      Boolean  @default(false) // ticked while shopping
  addedAuto    Boolean  @default(true)  // false if the client added it by hand
  createdAt    DateTime @default(now())
}
```

**Derived, not stored:**

```ts
type StockStatus = "ok" | "low" | "out";
function stockStatus(item: Pick<Item, "quantity" | "threshold">): StockStatus {
  if (item.quantity <= 0) return "out";
  if (item.quantity <= item.threshold) return "low";
  return "ok";
}

// "3 cases + 4 bags" for packSize 12, quantity 40
function formatQuantity(item: Pick<Item, "quantity" | "unitName" | "packSize" | "packName">): string;

// Convert an entry of {packs, units} to base units
function toBaseUnits(packs: number, units: number, packSize: number | null): number;
```

Put these in `src/lib/stock.ts` with Vitest tests.

**API surface** (all JSON, all Zod-validated, all behind auth):

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/items?location=&category=&status=&q=` | list with filters |
| POST | `/api/items` | create |
| GET / PATCH / DELETE | `/api/items/[id]` | read, edit, delete |
| PUT / GET / DELETE | `/api/items/[id]/image` | upload (multipart), serve with `Cache-Control: private, max-age=86400` and an ETag from `updatedAt`, remove |
| POST | `/api/items/[id]/take` | `{ quantity }` in base units; creates TAKE movement; clamps at 0 and returns `clamped: true` if so |
| POST | `/api/items/[id]/receive` | `{ quantity }`; creates RECEIVE movement |
| POST | `/api/items/[id]/count` | `{ counted }`; creates COUNT movement |
| POST | `/api/movements/[id]/undo` | reverses that movement with an ADJUST; only allowed within 10 minutes and only for the latest movement on the item |
| POST | `/api/items/reorder` | `{ orderedIds: string[] }` for manual sort within a location |
| GET / POST | `/api/categories`, `/api/locations` | list, create |
| PATCH / DELETE | `/api/categories/[id]`, `/api/locations/[id]` | rename/reorder, delete (items keep existing, FK set null) |
| GET | `/api/reorder` | current list joined with item |
| POST | `/api/reorder` | add item manually |
| PATCH | `/api/reorder/[id]` | check/uncheck, change requestedQty |
| POST | `/api/reorder/[id]/receive` | creates RECEIVE for requestedQty and removes the entry |
| DELETE | `/api/reorder/[id]` | remove without receiving |

After every take/receive/count, recompute the reorder list for that item: if status is `low` or `out` and no entry exists, add one with `addedAuto: true`; if status returns to `ok` and the entry has `addedAuto: true` and is unchecked, remove it.

## 7. Inventory-specific UI: what "good" means

These three surfaces are where inventory apps usually look and feel bad. The bar for each:

### 7a. The item list (dense data table)

- **Grouped by location** in location `sortOrder`, each group opening with a heavy rule and an uppercase Barlow Condensed heading (the aisle sign). Items with no location go in a final "Unassigned" group. Category is a filter chip row above the table and a small muted label in the row, not a second grouping.
- **Row anatomy, desktop (≥ 900px):** thumbnail 40px square (or a stencil-grey placeholder with the first letter), name in Barlow 16/600, description under it in 14 muted, truncated to one line. Then the quantity numeral in Barlow Condensed 44 right-aligned with tabular figures, followed by a small "of 12 threshold" style secondary line. Then a status mark. Then a fixed action cluster: `Take` (primary), `Edit` (secondary). Row height is `--height-row`. No card, no rounded container per row.
- **Row anatomy, mobile (< 900px):** two-line row, `--height-row-touch` tall. Line one: name and numeral. Line two: location/category muted plus status. The whole row is the tap target and opens the take sheet. Edit is reachable through a long-press or a chevron at the far right, never a hover-only control.
- **Density rules:** column widths are fixed so numerals line up down the entire page. Never let a row grow taller because of a long name; truncate and expose the full name on the detail screen. Sticky group headings while scrolling. Zebra striping is forbidden; the hairline rule is enough.
- **Status ordering:** a "Running low" strip pinned above the grouped list shows out and low items first, sorted out-then-low-then-by-name, with the count in the heading ("Running low · 3" is forbidden; write "3 items running low"). If nothing is low, the strip collapses to a single quiet line: "Nothing is running low." An item appears both in the strip and in its location group; that duplication is intentional.
- **Filters:** search box (name, description), location select, category chip row, status toggle (all / low / out). Filters live in the URL query string so a view can be bookmarked.
- **Empty state:** an empty storeroom is an invitation: one sentence, one `Add your first item` button, no illustration.

### 7b. Stock status indicators

- Status is communicated **three ways at once** so it survives colorblindness and a dim room: the numeral color (stencil / safety-deep / bay-red), a filled bar under the numeral showing quantity against threshold (a 6px-tall stencil bar in a `--color-rule-soft` track, filled proportionally, clamped at 2x threshold so "plenty" reads as full), and a one-word text mark ("low", "out") after the numeral. `ok` items show no word.
- The bar is the only place safety yellow appears in a normal row, and only when low. On an `ok` row the bar is stencil. This keeps yellow meaningful.
- Never use a traffic-light dot on its own. Never use a badge with a rounded pill background.
- The nav shows the count of low+out items as a plain number next to "Reorder", not a red circle.

### 7c. Count-entry flow (the take sheet and the full count)

**Take sheet** (opened from any row or its `Take` button):
- A bottom sheet on mobile, a right-side panel on desktop. Item name, thumbnail, current quantity in 72px Barlow Condensed.
- A row of preset buttons: `-1`, `-2`, `-5`, `-10`, plus, if the item has packs, `-1 case` (using `packName`). Each press immediately performs the take and the numeral rolls to the new value. No confirm step. This is the whole point: one tap per removal.
- A numeric field for arbitrary amounts with `inputmode="numeric"`, plus a pack/unit toggle when `packSize` is set, showing the base-unit conversion live ("2 cases = 24 bags").
- After every take, a single-line notice at the top of the sheet: "Took 5. 3 left." with an `Undo` action that stays for 10 seconds and calls the undo endpoint. The action name is "Take" everywhere: button, notice, movement type in history.
- Taking more than is on hand clamps to zero and says so: "Only 3 were left, set to 0."
- A `Receive` tab in the same sheet with the same layout for deliveries (`+1`, `+5`, `+1 case`, field).
- Keyboard: on desktop, digits type into the field, Enter takes, Escape closes. Focus is trapped in the sheet.

**Full count** (`/count` route):
- Walks every non-archived item in location order, then `sortOrder`. One item per screen on mobile, a vertical list on desktop; both are the same component.
- Each item shows its name, thumbnail, and last known quantity, with a large numeric field pre-filled with that quantity and fully selected on focus so typing replaces it. If packs exist, a pack + units pair with live conversion.
- `Next` moves on and stages the value in local state. Nothing is written until `Finish count`, which posts every changed item to `/api/items/[id]/count` and shows a summary: "Counted 42 items, 7 changed" with a list of the changes and their deltas. Unchanged items produce no movement.
- Progress is shown as "12 of 42" in the header, with the current location name. A count can be abandoned; ask once before discarding staged values.
- Skipping an item is one tap and leaves it unchanged.

## 8. Other screens

- `/login`: username, password, one button. The wordmark and nothing else. Errors say what went wrong: "That username or password isn't right."
- `/items/new` and `/items/[id]/edit`: one form. Name, description (200 char, counter), category (creatable select), location (creatable select), unit name, "sold in packs?" toggle revealing pack name + pack size, current quantity with pack/unit entry, threshold with the same entry and a helper line "You'll be warned when 10 or fewer are left", image (drag-drop or tap, browser-resized to 512px JPEG before upload, with preview and remove). Save says "Save item"; the toast says "Saved". Delete lives in the edit form behind a confirm that names the item.
- `/items/[id]`: the detail screen: full-size image, all fields, quantity with the same take/receive presets inline, and (v1) the last 20 movements as a plain table. This is the only history surface in v1.
- `/reorder`: the shopping list. Grouped "To buy" and "Bought" (checked). Each row: name, requested quantity in packs and units, checkbox. `Received` on a checked row restocks and removes it. `Add item` lets the client add anything manually. A `Copy list` button puts a plain-text version on the clipboard for texting to a supplier.
- `/settings`: manage categories and locations (rename, reorder by drag, delete), and change the default take presets.
- Top nav: wordmark, `Storeroom`, `Count`, `Reorder N`, `Settings`, `Sign out`. Bottom tab bar on mobile with the same five.
- Global offline banner: listen to `navigator.onLine`; when offline, show "You're offline. Changes won't save until you're back on Wi-Fi." and disable every mutating control.

## 9. Phased build order

Every phase ends in something runnable. Do not start a phase until the previous one passes its checks. After each phase, run the **screenshot critique loop** in section 10 and commit.

**Phase 0: scaffold and tokens.**
`create-next-app` with TypeScript, Tailwind v4, App Router, `src/` dir. Install deps. Fonts via `next/font/google`. Write `globals.css` with the full `@theme` block from section 5. Run the frontend-design skill and write `docs/design-plan.md`. Build the dev-only `/tokens` route showing every color with its name, every type size in both faces, spacing scale, the two rule weights, and a sample numeral at 44 and 72. Add `.gitignore`, `README.md` stub, ESLint. Runnable: `npm run dev` shows `/tokens`.

**Phase 1: data and auth.**
Prisma schema from section 6, `prisma.config.ts` with the pg adapter, first migration, `src/lib/prisma.ts` singleton. Seed script with 25 realistic storeroom items across 4 locations and 5 categories, several of them low or out. next-auth setup, `/login`, `src/proxy.ts`. `scripts/hash-password.mjs`. Runnable: log in, see an empty "Storeroom" page with the nav.

**Phase 2: items CRUD and the list.**
All `/api/items*` and `/api/items/[id]/image` routes. The item form (create/edit/delete) with image upload. The grouped item list from section 7a with the status system from 7b, filters in the URL, and the empty state. `stock.ts` with tests. Runnable: add, edit, delete, photograph items; list groups and filters correctly at desktop and mobile widths.

**Phase 3: take and receive.**
Take sheet from 7c, the take/receive/undo endpoints, the running-low strip, the numeral roll animation, the row flash, the nav count. Runnable: the daily workflow is complete end to end on a phone.

**Phase 4: full count, categories, locations.**
`/count` flow, `/settings` management screens, drag reorder of items within a location, and the `/api/categories`, `/api/locations`, `/api/items/reorder` routes. Runnable: walk a full count and see the summary.

**Phase 5: reorder list.**
`ReorderEntry` automation on every movement, `/reorder` screen, receive-from-list, copy-as-text. Runnable: a low item shows up on the list automatically; receiving it restocks and clears it.

**Phase 6: polish, deploy, portfolio.**
Offline banner. Keyboard and screen-reader pass (every control reachable by Tab, visible focus ring in steel, labels on every input, live region for the take notice). Reduced-motion check. Lighthouse mobile performance and accessibility both ≥ 90. `render.yaml`:

```yaml
services:
  - type: web
    name: stockery
    runtime: node
    buildCommand: npm install && npx prisma generate && npx prisma migrate deploy && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: AUTH_SECRET
        sync: false
      - key: ADMIN_USERNAME
        sync: false
      - key: ADMIN_PASSWORD_HASH
        sync: false
      - key: NODE_ENV
        value: production
```

README with: one-paragraph description, three screenshots (list, take sheet, count) at phone width, the stack with the reason for each pick, local setup (Neon connection string, hash script, env vars), deploy steps for Render, and a short "design notes" section pointing at `docs/design-plan.md`. Runnable: deployed URL works on a phone.

## 10. Screenshot critique loop (after every phase)

Use the Chrome DevTools MCP server (`chrome-devtools-mcp`, already connected). For each phase:

1. Start the dev server. Open the phase's main screen in DevTools MCP.
2. Emulate a **1440×900 desktop** viewport and take a full-page screenshot. Save to `docs/screens/phase-N-desktop.png`.
3. Emulate a **390×844 mobile** viewport (iPhone-class, touch) and screenshot the same screen and the take sheet if it exists. Save to `docs/screens/phase-N-mobile.png`.
4. Look at both screenshots and write a critique to `docs/critique-log.md` under a heading for the phase. Answer these specifically: Does the quantity numeral dominate the row as intended? Is safety yellow appearing anywhere other than primary actions and low status? Do the numerals align vertically down the whole list? Is any element rounded more than 4px? Is there any all-caps text outside the wordmark and aisle headings? Does it look like the SaaS card kit or any other tell from the frontend-design skill? Would a stranger recognise the "Receiving Dock" idea without being told? Are tap targets ≥ 44px on mobile? Does the page scroll horizontally at 390px (it must not)?
5. Fix everything the critique found. Re-screenshot. Only then commit with a message naming the phase.
6. Also capture the console; any error or warning is a blocker.

Do not skip the critique because the phase "looks fine". Write it down every time.

## 11. Copy and naming rules

- Sentence case everywhere except the two agreed uppercase uses.
- Buttons say what happens: `Take`, `Receive`, `Save item`, `Finish count`, `Received`. Never `Submit`, `OK`, or `Confirm`.
- An action keeps its name across the flow: `Take` button → "Took 5" notice → `TAKE` movement type in the detail table rendered as "Took".
- Errors say what happened and what to do. Empty states say what to do next. No apologies, no exclamation marks.
- Plain kitchen vocabulary: "storeroom", "running low", "out", "delivery", "case". Never "SKU", "inventory record", "entity".

## 12. Definition of done

- `npm run lint`, `npx tsc --noEmit`, and `npx vitest run` all pass.
- No raw hex values outside `globals.css`.
- Every phase has desktop and mobile screenshots and a critique entry.
- `docs/design-plan.md` lists the decisions taken from the frontend-design skill and the one uppercase override.
- Deployed on Render, reachable on a phone, seed data visible after login.
- README complete as described in Phase 6.

## 13. Stretch goals (after v1 ships, in this order)

1. Movement history page per item with a usage-rate estimate ("about 4 a day, empty in 5 days") computed from TAKE movements over the last 30 days; surface the estimate in the low-stock strip.
2. Weekly email digest of low items via Resend and a Render cron job.
3. PWA install and read-only offline cache of the item list.
4. Barcode/QR label printing for shelves that deep-link to the take sheet.
5. Multi-user accounts with per-person take history.
