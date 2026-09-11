"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Boxes, ClipboardList, ListChecks, LogOut, Settings } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { Wordmark } from "@/components/wordmark";
import { useT } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n/en";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "nav.storeroom", icon: Boxes },
  { href: "/count", label: "nav.count", icon: ClipboardList },
  { href: "/reorder", label: "nav.reorder", icon: ListChecks },
  { href: "/settings", label: "nav.settings", icon: Settings },
] as const satisfies readonly { href: string; label: MessageKey; icon: unknown }[];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/items");
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Top bar on desktop, tab bar on phones. The same six destinations in both.
// The reorder count is a plain number after the word, never a red circle.
export function AppNav({ reorderCount }: { reorderCount: number }) {
  const pathname = usePathname();
  const t = useT();

  return (
    <>
      <header className="sticky top-0 z-30 bg-concrete">
        <div className="mx-auto flex h-14 w-full max-w-content items-center gap-6 px-4 md:px-6">
          <Wordmark href="/" />
          <nav aria-label={t("nav.main")} className="hidden items-center gap-1 desk:flex">
            {links.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-tap items-center gap-2 rounded-control px-3 text-base font-semibold",
                    active ? "bg-safety text-on-safety" : "text-stencil hover:bg-paper",
                  )}
                >
                  {t(label)}
                  {href === "/reorder" && reorderCount > 0 ? (
                    <span className="tabular font-normal">{reorderCount}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          {/* On a phone the header carries only the wordmark, so the language
              button lives here rather than taking a sixth tab and squeezing
              every label in the bar. Sign out stays in the bar on phones. */}
          <div className="ms-auto flex items-center gap-1">
            <LanguageToggle />
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="hidden h-tap items-center gap-2 rounded-control px-3 text-base font-semibold text-stencil hover:bg-paper desk:flex"
            >
              <LogOut aria-hidden className="size-5 rtl:-scale-x-100" />
              {t("nav.signOut")}
            </button>
          </div>
        </div>
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <div className="rule-heavy" />
        </div>
      </header>

      <nav
        aria-label={t("nav.main")}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-rule-soft bg-paper pb-[env(safe-area-inset-bottom)] desk:hidden"
      >
        <ul className="grid grid-cols-5">
          {links.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-1 text-xs font-semibold",
                    active ? "text-stencil" : "text-stencil-muted",
                  )}
                >
                  <span className={cn("flex h-6 w-10 items-center justify-center rounded-control", active && "bg-safety text-on-safety")}>
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <span className="max-w-full truncate px-1">
                    {t(label)}
                    {href === "/reorder" && reorderCount > 0 ? (
                      <span className="tabular font-normal"> {reorderCount}</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex h-14 w-full flex-col items-center justify-center gap-1 text-xs font-semibold text-stencil-muted"
            >
              <span className="flex h-6 w-10 items-center justify-center">
                <LogOut aria-hidden className="size-5 rtl:-scale-x-100" />
              </span>
              <span className="max-w-full truncate px-1">{t("nav.signOut")}</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
