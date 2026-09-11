"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Moon, Sun } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n/en";
import type { Theme } from "@/lib/theme";
import { setTheme } from "@/lib/theme-actions";
import { cn } from "@/lib/utils";

// Three states, one segmented control, styled like the status filter above
// the storeroom list. The click writes a cookie in a Server Function and then
// refreshes: the theme is decided on the server, so there is no flash and no
// second copy of the choice living in the browser.

const OPTIONS: { value: Theme; label: MessageKey; icon: typeof Sun }[] = [
  { value: "system", label: "theme.system", icon: Monitor },
  { value: "light", label: "theme.light", icon: Sun },
  { value: "dark", label: "theme.dark", icon: Moon },
];

export function ThemeToggle({ theme }: { theme: Theme }) {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();

  function choose(next: Theme) {
    if (next === theme) return;
    startTransition(async () => {
      await setTheme(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t("theme.label")}
      className={cn(
        "flex h-tap w-full max-w-sm rounded-control border border-stencil",
        pending && "opacity-60",
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            disabled={pending}
            onClick={() => choose(value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-3 text-base font-semibold",
              active ? "bg-stencil text-paper" : "text-stencil",
            )}
          >
            <Icon aria-hidden className="size-5" />
            {t(label)}
          </button>
        );
      })}
    </div>
  );
}
