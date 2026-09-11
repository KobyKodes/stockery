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
