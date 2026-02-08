"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const action =
      mode === "signup"
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password });

    const { data, error: authError } = await action;
    setBusy(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (mode === "signup" && !data.session) {
      setMessage("Check your email to confirm the new account.");
      return;
    }

    setMessage("Signed in");
    router.replace(nextPath);
    router.refresh();
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-[1.1fr_0.9fr]">
      <Card className="shadow-[0_22px_50px_rgba(7,89,79,0.14)]">
        <CardHeader className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Supabase Auth
          </Badge>
          <CardTitle className="text-2xl font-semibold">
            {mode === "signin" ? "Welcome back" : "Create your operator account"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in with the credentials defined in your Supabase project. Sessions
            persist in secure cookies; you&apos;ll be redirected to your next task.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                autoComplete="email"
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                id="password"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                type="password"
                value={password}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <Button className="w-full" disabled={busy} type="submit">
              {busy ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Supabase URL + anon key must be set in .env.local.</span>
            <Button
              className="h-8 px-3 text-xs"
              onClick={() => setMode((prev) => (prev === "signin" ? "signup" : "signin"))}
              type="button"
              variant="ghost"
            >
              {mode === "signin" ? (
                <>
                  <UserPlus className="mr-2 h-3.5 w-3.5" /> Need an account?
                </>
              ) : (
                "Have an account? Sign in"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed bg-muted/40">
        <CardHeader className="space-y-3">
          <Badge className="w-fit" variant="outline">
            Access policy
          </Badge>
          <CardTitle className="text-xl">Operator roles</CardTitle>
          <p className="text-sm text-muted-foreground">
            Profiles live in the `profiles` table. The first login creates a profile with
            role <code>user</code>; promote to <code>admin</code> directly in Supabase if
            you need stricter controls.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Sessions are stored as HttpOnly cookies; no client secrets.</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Set <code>SUPABASE_URL</code> / <code>SUPABASE_ANON_KEY</code> / <code>SUPABASE_SERVICE_ROLE_KEY</code>.</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Redirects back to <code>{nextPath}</code> after sign in.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
