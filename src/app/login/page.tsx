"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
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
      setError("That username or password isn't right.");
      setBusy(false);
      return;
    }
    const next = params.get("next");
    router.push(next && next.startsWith("/") ? next : "/");
    router.refresh();
  }

  return (
    <main className="flex min-h-full flex-1 flex-col px-4 py-12 md:px-6">
      <div className="mx-auto w-full max-w-xs">
        <div className="rule-heavy pt-3">
          <Wordmark />
        </div>
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1">
            <Label htmlFor="username">Username</Label>
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
            <Label htmlFor="password">Password</Label>
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
            <p role="alert" className="border-l-[3px] border-bay-red pl-3 text-xs">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={busy} className="mt-2">
            {busy ? "Signing in" : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}
