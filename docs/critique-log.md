# Screenshot critique log

One entry per phase, written after looking at the desktop (1440×900) and mobile (390×844) captures in `docs/screens/`. Each entry answers the same questions from the brief so the answers can be compared across phases.

## Phase 0: tokens

Screens: `phase-0-desktop.png`, `phase-0-mobile.png` (the `/tokens` route).

- **Does the quantity numeral dominate?** Yes. The 44 and 72 Barlow Condensed samples are the loudest thing on the page even among swatches. The 14 and 16 condensed samples look cramped and should not be used at those sizes; condensed stays at 20 and above.
- **Is safety yellow anywhere other than primary actions and low status?** Only in its own swatch, the low bar, and the primary control sample. The wordmark block that was in the first sketch is gone.
- **Do numerals align vertically?** Tabular figures are on; "1,240" at 44 and 72 keep equal digit widths. Nothing to align yet across rows.
- **Anything rounded more than 4px?** No. All radius tokens including shadcn's are pinned to 4px.
- **All-caps outside the wordmark and aisle headings?** None on this page.
- **SaaS card kit or other tells?** The swatches sit flat on the concrete with a hairline edge only where a light swatch would vanish. No shadows except the single elevation sample. Nothing reads as a card.
- **Would a stranger recognise "Receiving Dock"?** Not yet from swatches alone, though the yellow plus blue-black plus condensed numerals already read as signage rather than a dashboard.
- **Tap targets ≥ 44px on mobile?** No controls yet. The control samples are 44px tall.
- **Horizontal scroll at 390px?** No: scrollWidth 390, clientWidth 390.
- **Console:** no errors or warnings.

Fixes made after this critique: none required. Noted for later phases: never set condensed below 20px; the small-size condensed rows on the tokens page exist only to show the scale.

## Phase 1: data and auth

Screens: `phase-1-login-desktop.png`, `phase-1-login-error.png`, `phase-1-desktop.png`, `phase-1-mobile.png`.

- **Does the quantity numeral dominate?** No numerals on screen yet. The only display type is the wordmark and the page heading, both at 28px, which leaves headroom for the 44px numerals to come.
- **Is safety yellow anywhere other than primary actions and low status?** The active nav item is filled safety (an active state, allowed by the brief). The sign-in button is safety. Nothing else.
- **Do numerals align vertically?** Not applicable yet. The reorder count in the nav uses tabular figures.
- **Anything rounded more than 4px?** No. Inputs, buttons, and the active nav block are all 4px.
- **All-caps outside the wordmark and aisle headings?** None. Form labels are sentence case.
- **SaaS card kit or other tells?** The login form has no card: the wordmark sits under a heavy rule and the fields sit straight on concrete. The error is a bay-red left rule with stencil text, not a pink pill.
- **Would a stranger recognise "Receiving Dock"?** The heavy rule under the header and the condensed caps wordmark read as a sign on a beam. The yellow active block is a first hint of bay-number signage.
- **Tap targets ≥ 44px on mobile?** Bottom tabs measure 56px tall; desktop nav links and the sign-in button are 44px.
- **Horizontal scroll at 390px?** No: 390/390.
- **Console:** no errors or warnings on login, the wrong-password path, or the storeroom shell.

Fixes made after this critique: none. The Next.js dev-tools bubble overlaps the first tab in the mobile capture; it is a dev overlay and does not ship.

## Phase 2: items and the list

Screens: `phase-2-desktop.png`, `phase-2-mobile.png`, `phase-2-form-mobile.png`, `phase-2-detail-mobile.png`, `phase-2-delete-mobile.png`.

- **Does the quantity numeral dominate?** Yes. On desktop the 44px condensed numerals are the first thing the eye lands on in every row; names are 16/600 and everything else is 14 muted. On the phone the numeral is still 44px and sits on the right of the two-line row.
- **Is safety yellow anywhere other than primary actions and low status?** First capture: no. Every row had a yellow Take button, so yellow was on all 25 rows and meant nothing. Fixed: the row's Take is a stencil-outlined secondary and Edit is a ghost. Yellow now appears on Add item, the active nav item, and the low bars only.
- **Do numerals align vertically?** First capture: no. The "low"/"out" word after the numeral pushed those digits left of the ok rows. Fixed by reserving a fixed-width word slot on every numeral, so the digits share one right edge down the whole page.
- **Anything rounded more than 4px?** No. Rows and rules are square; controls are 4px.
- **All-caps outside the wordmark and aisle headings?** None. Group headings (SHELF A, UNDER SINK) are the agreed aisle-sign use.
- **SaaS card kit or other tells?** No cards. Rows are separated by hairlines, groups by 3px rules. The delete dialog is the one raised surface and it uses the single shadow value. The filter chips are 4px-radius outlines, not pills.
- **Would a stranger recognise "Receiving Dock"?** The heavy rules with uppercase condensed shelf names read as aisle signs, and the numeral column reads as bay numbers. Closer than phase 1.
- **Tap targets ≥ 44px on mobile?** Row tap area is 64px; the edit chevron is 44×64; filter buttons are 44px; chips are 36px tall (they sit in a scroll row and are the one exception, noted for the accessibility pass in phase 6).
- **Horizontal scroll at 390px?** No: 390/390 on the list, the form, and the detail page.
- **Console:** three Base UI warnings on the first load (a Button rendered as a Link without `nativeButton={false}`), fixed in the Button component. A DevTools issue for form fields without a name: fixed by naming the search, location select and the units input. No errors after the fixes.

Other fixes from this pass: the threshold column wrapped for "3,000 napkins", so it is wider and truncates; "each" no longer pluralises to "eaches"; the detail page's date column no longer wraps.

## Phase 3: take and receive

Screens: `phase-3-desktop.png`, `phase-3-undo-desktop.png`, `phase-3-mobile.png`, `phase-3-sheet-mobile.png`.

- **Does the quantity numeral dominate?** More than anywhere else. The sheet's 72px numeral is the largest thing on screen and rolls to its new value after each take, which is exactly where the eye already is.
- **Is safety yellow anywhere other than primary actions and low status?** The take presets are yellow because they are the primary action, which is what the design plan calls for. The receive presets are stencil outlines, so the two modes are told apart by weight rather than by a second colour. The submit button next to the amount field was yellow too; it is now an outline, because a disabled yellow button reads as a broken one and five yellow buttons in a row was already the limit.
- **Do numerals align vertically?** Yes in the list. In the sheet there is one numeral, so nothing to align.
- **Anything rounded more than 4px?** No.
- **All-caps outside the wordmark and aisle headings?** None. The sheet title is sentence case at 14px.
- **SaaS card kit or other tells?** The sheet is a single paper surface with the one shadow value, sliding up from the bottom on a phone and in from the right on desktop. No cards inside it.
- **Would a stranger recognise "Receiving Dock"?** Yes. Black-on-yellow preset buttons under a very large condensed numeral is the loading-bay vocabulary the brief asked for.
- **Tap targets ≥ 44px on mobile?** Presets, the amount field, the pack toggle and the close button are all 44px or taller.
- **Horizontal scroll at 390px?** No.
- **Console:** clean through take, undo, clamp and receive.

Behaviour checked in the browser, not just in code: one tap on a preset performs the take with no confirm step; the notice reads "Took 2. 3 left." with an Undo that calls the undo endpoint and restores the quantity; taking more than is on hand says "Only 2 were left, set to 0."; the Receive tab adds a full case; the row behind the sheet updates and flashes; the sheet stays open for the next tap; typing a digit anywhere focuses the amount field, Enter takes, Escape closes; focus is trapped in the sheet.

Fix made after this critique: the digit shortcut was bound to the panel element, so it did nothing while focus sat on the sheet's close button. It now listens on the document and ignores events from other fields.
