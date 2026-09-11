"use client";

import { Suspense, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { LanguageToggle } from "@/components/language-toggle";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useT();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await signIn("credentials", { username, password, redirect: false });
    if (result?.error) {
      setError(t("login.failed"));
      setBusy(false);
      return;
    }
    const next = params.get("next");
    router.push(next && next.startsWith("/") ? next : "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <Label htmlFor="username">{t("login.username")}</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoFocus
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="password">{t("login.password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? (
        <p role="alert" className="border-s-[3px] border-bay-red ps-3 text-xs">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={busy} className="mt-2">
        {busy ? t("login.signingIn") : t("login.signIn")}
      </Button>
    </form>
  );
}

// useSearchParams needs a Suspense boundary so the shell can be prerendered.
// The language button sits above the form: someone who cannot read the login
// screen has to be able to change it before signing in.
export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col px-4 py-12 md:px-6">
      <div className="mx-auto w-full max-w-xs">
        <div className="flex items-center justify-between gap-4">
          <LanguageToggle />
        </div>
        <div className="mt-2 rule-heavy pt-3">
          <Wordmark />
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
