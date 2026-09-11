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
