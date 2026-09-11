# Stockery design plan

Direction: **Receiving Dock**. The storeroom is a small warehouse, so the app borrows from the things that already work in warehouses: black-on-yellow bay numbers, condensed shipping-label type, heavy rules on an aisle map. The page is quiet everywhere except the quantity numeral, which is the whole point of the product.

## Decisions taken from the frontend-design skill

- **One type family, two widths.** Barlow (body) and Barlow Condensed (display) are the same family, so the page reads as one voice. The condensed cut is only used where size does the work: the wordmark, headings, and every quantity numeral.
- **One memorable element.** The quantity numeral is the only bold thing on any screen: 44px in a row, 72px in the take sheet. No hero, no gradient, no illustration, no decorative type.
- **Borders encode information.** A 3px stencil rule means "new shelf" and sits above every location group. A 1px rule separates rows. Nothing else has a border. There are no card outlines.
- **No numbered markers.** The full count is the only real sequence in the app and it shows progress as "12 of 42", not as step badges.
- **Motion answers the user.** The numeral rolls after a take, the row flashes after a change, the sheet slides up when opened. The only page-load motion is the low-stock strip counting up once. `prefers-reduced-motion` zeroes every duration.
- **Sentence case everywhere**, except the two agreed uppercase uses below. No tracked-out eyebrow labels, no uppercase buttons or form labels.
- **Tabular figures, not monospace.** Every numeric cell sets `font-variant-numeric: tabular-nums` so columns align without a monospace face.
- **Buttons say what happens.** Take, Receive, Save item, Finish count, Received. The name follows the action through the flow: the Take button produces "Took 5" and a movement rendered as "Took".
- **Empty and error states give direction.** An empty storeroom says "Add your first item". A failed login says "That username or password isn't right." No apologies, no exclamation marks.
- **No middle-dot meta strings, no arrows on buttons, no hover transitions on every element.** Counts are written as sentences: "3 items running low".
- **Colors are tokens.** Every color in a component comes from a token in `globals.css`. Raw hex outside that file is a lint failure for this project.
- **Spend boldness once, then remove an accessory.** The wordmark had a safety-yellow block behind it in the first sketch. It was cut so yellow keeps its meaning (action and low stock) and the numerals stay the loudest thing.

### Agreed override of the skill

Uppercase type is used for exactly two things: the "STOCKERY" wordmark and the location group headings in the item list. Both are warehouse signage, where uppercase is the vernacular, and the direction depends on that reference. Everywhere else is sentence case.

## Color

Six named colors. The brief's palette was the starting point; three values were darkened after contrast checks (see the review section).

| Token | Hex | Role |
|---|---|---|
| concrete | `#E9E7E1` | Page background. Warm grey like a sealed storeroom floor. Not white, not cream. |
| paper | `#F7F6F2` | Raised surfaces: the take sheet, dialogs, a row under the pointer. |
| stencil | `#14181C` | Text, heavy rules, the ok-status bar. A blue-black, chosen to sit against warm concrete. |
| safety | `#FFC72C` | The one accent. Primary action fill, the active nav item, the low-stock bar. |
| bay-red | `#C5213A` | Out of stock and destructive actions. Nowhere else. |
| steel | `#3D5F91` | Links, secondary interactive text, focus rings. |

Supporting values: `stencil-muted #4B5259` for secondary text, `rule-soft #C9C6BE` for hairline rules and bar tracks, `safety-deep #E0A800` for the pressed state of a safety button, `safety-ink #8A6400` for low-status numerals (yellow is a fill color, not a text color).

Contrast, checked against WCAG AA at the sizes used:

| Pair | Ratio | Use |
|---|---|---|
| stencil on concrete | 14.5:1 | body text |
| stencil on safety | 11.4:1 | primary button label |
| stencil-muted on concrete | 6.4:1 | secondary text at 14px |
| steel on concrete | 5.2:1 | links at 14px and 16px |
| bay-red on concrete | 4.6:1 | out numerals, small "out" mark |
| paper on bay-red | 5.3:1 | destructive button label |
| safety-ink on concrete | 4.3:1 | low numerals at 44px and 72px (large text needs 3:1) |

## Type

- **Barlow Condensed 700** for the wordmark, page headings, location group headings, and every quantity numeral. Leading 0.95 on display sizes.
- **Barlow 400/600** for body, labels, table text, buttons. Leading 1.45.
- Scale (Bringhurst, from a 16px base): 14 / 16 / 20 / 28 / 44 / 72.
- Line length under 80 characters in any prose; the item form and detail screen cap their text column at 40rem.
- Numerals always use tabular figures.

## Layout

Left-aligned throughout. Content column up to 72rem, gutters 16px on phone and 24px on desktop. The top nav sits on a 3px stencil rule, like a sign hung on a beam. On phones the same five destinations move to a bottom tab bar.

### Storeroom list, desktop (≥ 900px)

```
STOCKERY   Storeroom  Count  Reorder 3  Settings          Sign out
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Storeroom                                          [+ Add item]

[search items          ] [Location v] [All][Cleaning][Paper]...  [all|low|out]

3 items running low
───────────────────────────────────────────────────────────────────
[img] Blue roll                  ▕▏  2 low   of 6 threshold   Take  Edit
      centrefeed, 2ply         ▂▂▂▂▂▂▂
───────────────────────────────────────────────────────────────────
[img] Bin bags 240L               ▕▏  0 out  of 20 threshold  Take  Edit
      black, heavy duty        ▁▁▁▁▁▁▁

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHELF A
───────────────────────────────────────────────────────────────────
[img] Degreaser 5L               ▕▏ 12       of 4 threshold   Take  Edit
      kitchen surfaces          ▇▇▇▇▇▇▇
───────────────────────────────────────────────────────────────────
[img] Bleach 5L                  ▕▏  7       of 4 threshold   Take  Edit
                                 ▇▇▇▇▇▇▇
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UNDER SINK
```

Column widths are fixed: thumbnail 40px, name flexes, numeral column 8rem right-aligned, threshold line 9rem, action cluster 10rem. Numerals line up down the whole page. The group heading is sticky under the nav while its rows scroll.

### Storeroom list, phone (< 900px)

Two-line rows, 64px tall. The whole row opens the take sheet; the chevron at the far right opens edit.

```
STOCKERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[search items                        ]
[All] [Cleaning] [Paper] [Drinks]  ›

3 items running low
──────────────────────────────────────
Blue roll                       2 low ›
Shelf A, Paper                  ▂▂▂▂▂▂
──────────────────────────────────────
Degreaser 5L                     12   ›
Shelf A, Cleaning               ▇▇▇▇▇▇
──────────────────────────────────────

  Storeroom   Count   Reorder 3   Settings   Sign out
```

The muted second line joins location and category with a comma, never a middle dot.

### Take sheet (bottom sheet on phone, right panel on desktop)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Took 5. 3 left.                  Undo
──────────────────────────────────────
[img] Blue roll
      Shelf A

         3
        rolls
      ▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂

  Take        Receive
  ────────

 [ -1 ] [ -2 ] [ -5 ] [ -10 ] [ -1 case ]

 [ 2       ] [cases|rolls]   2 cases = 24 rolls
 [        Take 24 rolls        ]
```

The numeral is 72px Barlow Condensed and is the only large thing in the sheet. Preset buttons are 44px tall, safety-filled for Take, stencil-outlined for Receive. The notice line at the top is a live region.

### Full count

Same anatomy one item at a time on phone (name, thumbnail, last count, one large field, Skip and Next), stacked as a vertical list on desktop. Header reads "12 of 42" and the current location name.

## Principles

1. The numeral is the product. Everything else on screen is set to make it readable from arm's length in a dim room.
2. Yellow means something. It appears on primary actions and on low stock, and nowhere else.
3. Rules are information. A heavy rule is a new shelf. A hairline is the next item. There are no other borders.
4. One tap per removal. The take sheet never asks for confirmation; it offers Undo instead.
5. Plain kitchen words. Storeroom, running low, out, delivery, case. Never SKU or inventory record.

## Review against the brief and the skill's generic tells

Checked each part of the plan against what a default inventory dashboard would look like, and against the skill's list of tells.

- **Changed: bay-red `#D7263D` to `#C5213A`.** The brief's value reads at 4.0:1 on concrete, which fails AA for the small "out" word and for error text. The darker value passes at 4.6:1 while staying the same hue. Fills and large numerals were fine either way.
- **Changed: steel `#4A6FA5` to `#3D5F91`.** The brief's value is 4.1:1 on concrete, which fails AA for 14px and 16px link text. Focus rings only need 3:1, so the original would have worked for rings alone, but one steel is simpler than two.
- **Added: safety-ink `#8A6400`.** The brief asks for low numerals in safety-deep, but `#E0A800` on concrete is 1.7:1 and no size rescues it. Yellow is kept as a fill (the bar, the buttons) and a dark amber carries the numeral text. The status is still told three ways: numeral color, bar, and the word "low".
- **Removed: a safety-yellow block behind the wordmark.** It made the header the loudest thing on the page and diluted what yellow means. The wordmark is now plain stencil condensed caps on the heavy rule.
- **Removed: a status dot.** The first sketch put a small coloured circle before the numeral. That is the traffic-light dot the brief forbids, and the bar plus the word already do the job.
- **Kept, deliberately: zero radius on rules and tables and 4px on controls.** The skill flags "broadsheet with hairline rules and zero radius" as a tell. Here the rules are the aisle map the direction is built on, and the brief pins the radius, so this is a choice rather than a default.
- **Kept: a warm grey ground rather than white.** Concrete `#E9E7E1` is not the cream-and-serif tell; there is no serif and no terracotta anywhere.
- **Copy pass.** Every count is a sentence ("3 items running low"), the phone row's second line joins with a comma, and no button ends in an arrow.
