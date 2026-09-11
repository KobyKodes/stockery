import { notFound } from "next/navigation";

// Dev-only: renders every design token so the token layer can be
// screenshotted and reviewed before any component exists.

const colors = [
  ["concrete", "bg-concrete", "Page background"],
  ["paper", "bg-paper", "Raised surfaces"],
  ["stencil", "bg-stencil", "Text, heavy rules"],
  ["stencil-muted", "bg-stencil-muted", "Secondary text"],
  ["safety", "bg-safety", "Primary action, low stock"],
  ["safety-deep", "bg-safety-deep", "Pressed safety"],
  ["safety-ink", "bg-safety-ink", "Low numerals"],
  ["bay-red", "bg-bay-red", "Out of stock, destructive"],
  ["steel", "bg-steel", "Links, focus rings"],
  ["rule-soft", "bg-rule-soft", "Hairlines, bar tracks"],
] as const;

const statuses = [
  ["status-ok", "bg-status-ok", "text-status-ok-ink"],
  ["status-low", "bg-status-low", "text-status-low-ink"],
  ["status-out", "bg-status-out", "text-status-out-ink"],
] as const;

const sizes = [
  ["xs", "text-xs", "14"],
  ["base", "text-base", "16"],
  ["lg", "text-lg", "20"],
  ["xl", "text-xl", "28"],
  ["2xl", "text-2xl", "44"],
  ["3xl", "text-3xl", "72"],
] as const;

const spaces = [
  ["1", "w-1", "4"],
  ["2", "w-2", "8"],
  ["3", "w-3", "12"],
  ["4", "w-4", "16"],
  ["6", "w-6", "24"],
  ["8", "w-8", "32"],
  ["12", "w-12", "48"],
] as const;

export default function TokensPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto w-full max-w-content px-4 py-8 md:px-6">
      <h1 className="text-xl">Design tokens</h1>
      <p className="mt-2 max-w-prose text-stencil-muted">
        Every value a component may use. Nothing on this page is a component.
      </p>

      <section className="mt-8">
        <h2 className="text-lg">Color</h2>
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {colors.map(([name, cls, role]) => (
            <li key={name}>
              <div className={`h-12 border border-rule-soft ${cls}`} />
              <div className="mt-2 text-base font-semibold">{name}</div>
              <div className="text-xs text-stencil-muted">{role}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg">Stock status</h2>
        <ul className="mt-4 grid grid-cols-3 gap-4">
          {statuses.map(([name, bar, ink]) => (
            <li key={name}>
              <div className={`numeral text-2xl ${ink}`}>12</div>
              <div className="mt-1 h-[6px] w-full bg-rule-soft">
                <div className={`h-full w-2/3 ${bar}`} />
              </div>
              <div className="mt-2 text-xs text-stencil-muted">{name}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg">Type</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <div className="text-xs text-stencil-muted">Barlow Condensed 700</div>
            {sizes.map(([name, cls, px]) => (
              <div key={name} className="mt-3 flex items-baseline gap-4">
                <span className="w-10 shrink-0 text-xs text-stencil-muted tabular">{px}</span>
                <span className={`font-display font-bold leading-display ${cls}`}>
                  Blue roll 1240
                </span>
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs text-stencil-muted">Barlow 400 / 600</div>
            {sizes.map(([name, cls, px]) => (
              <div key={name} className="mt-3 flex items-baseline gap-4">
                <span className="w-10 shrink-0 text-xs text-stencil-muted tabular">{px}</span>
                <span className={`font-body ${cls}`}>
                  Blue roll <span className="font-semibold">1240</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg">Numerals</h2>
        <div className="mt-4 flex flex-wrap items-end gap-8">
          <div>
            <div className="numeral text-2xl">1,240</div>
            <div className="text-xs text-stencil-muted">44 row</div>
          </div>
          <div>
            <div className="numeral text-3xl">1,240</div>
            <div className="text-xs text-stencil-muted">72 take sheet</div>
          </div>
          <div>
            <div className="numeral text-3xl text-status-low-ink">8</div>
            <div className="text-xs text-stencil-muted">72 low</div>
          </div>
          <div>
            <div className="numeral text-3xl text-status-out-ink">0</div>
            <div className="text-xs text-stencil-muted">72 out</div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg">Space</h2>
        <ul className="mt-4 flex flex-wrap items-end gap-6">
          {spaces.map(([name, cls, px]) => (
            <li key={name} className="text-center">
              <div className={`h-6 bg-stencil ${cls}`} />
              <div className="mt-1 text-xs text-stencil-muted tabular">{px}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg">Rules and radius</h2>
        <div className="mt-4 rule-heavy pt-2 text-xs text-stencil-muted">
          Heavy rule, 3px. A new shelf.
        </div>
        <div className="mt-4 rule-hair pt-2 text-xs text-stencil-muted">
          Hairline, 1px. The next item.
        </div>
        <div className="mt-4 flex gap-4">
          <div className="h-11 w-32 rounded-control bg-safety" />
          <div className="h-11 w-32 rounded-control border border-stencil" />
          <div className="h-11 w-32 rounded-control border border-rule-soft bg-paper" />
        </div>
        <div className="mt-1 text-xs text-stencil-muted">Controls, 4px. Nothing rounds further.</div>
      </section>

      <section className="mt-8 mb-12">
        <h2 className="text-lg">Elevation</h2>
        <div className="mt-4 h-24 w-64 bg-paper shadow-sheet" />
        <div className="mt-1 text-xs text-stencil-muted">One shadow, for the take sheet and dialogs.</div>
      </section>
    </main>
  );
}
