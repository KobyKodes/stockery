// Take and receive glyphs: heavy, square-ended bars on a 20px grid, cut the way
// warehouse stencil signage is, so they sit with the Barlow Condensed numerals
// rather than with a generic icon set. They take the current text colour.

type GlyphProps = { className?: string };

export function TakeGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={className} shapeRendering="crispEdges">
      <rect x="4" y="8.5" width="12" height="3" fill="currentColor" />
    </svg>
  );
}

export function ReceiveGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={className} shapeRendering="crispEdges">
      <rect x="4" y="8.5" width="12" height="3" fill="currentColor" />
      <rect x="8.5" y="4" width="3" height="12" fill="currentColor" />
    </svg>
  );
}
