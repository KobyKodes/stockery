"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { setLocale } from "@/lib/i18n/actions";
import { useI18n } from "@/lib/i18n/client";
import { LOCALE_NAMES, otherLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

// One button, two languages. It is labelled in the language it switches to,
// so it reads correctly to someone who cannot read the current one.
//
// The click writes a cookie in a Server Function and then refreshes: the
// whole tree re-renders on the server in the new language, which keeps one
// copy of every string instead of shipping both to the browser.

export function LanguageToggle({ variant = "bar" }: { variant?: "bar" | "tab" }) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();
  const next = otherLocale(locale);

  function switchLanguage() {
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  const label = LOCALE_NAMES[next];

  if (variant === "tab") {
    return (
      <button
        type="button"
        lang={next}
        onClick={switchLanguage}
        disabled={pending}
        aria-label={t("lang.switchToAria")}
        className="flex h-14 w-full flex-col items-center justify-center gap-1 text-xs font-semibold text-stencil-muted"
      >
        <span className="flex h-6 w-10 items-center justify-center">
          <Languages aria-hidden className="size-5" />
        </span>
        <span className="max-w-full truncate px-1">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      lang={next}
      onClick={switchLanguage}
      disabled={pending}
      aria-label={t("lang.switchToAria")}
      className={cn(
        "flex h-tap items-center gap-2 rounded-control px-3 text-base font-semibold text-stencil hover:bg-paper",
        pending && "opacity-60",
      )}
    >
      <Languages aria-hidden className="size-5" />
      {label}
    </button>
  );
}
