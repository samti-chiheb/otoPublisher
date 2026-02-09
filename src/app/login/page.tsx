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
    <div className="grid-2" style={{ alignItems: "start" }}>
      <Card>
        <CardHeader className="stack" style={{ gap: 8 }}>
          <Badge variant="strong">Supabase Auth</Badge>
          <CardTitle className="text-2xl">
            {mode === "signin" ? "Welcome back" : "Create your operator account"}
          </CardTitle>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Sign in with the credentials defined in your Supabase project. Sessions persist in secure cookies; you&apos;ll be redirected to your next task.
          </p>
        </CardHeader>
        <CardContent className="stack" style={{ gap: 12 }}>
          <form className="stack" style={{ gap: 12 }} onSubmit={handleSubmit}>
            <div className="stack" style={{ gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }} htmlFor="email">
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
            <div className="stack" style={{ gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }} htmlFor="password">
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
            {error ? <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p> : null}
            {message ? <p style={{ color: "var(--muted)", margin: 0 }}>{message}</p> : null}
            <Button disabled={busy} type="submit" className="btn btn-primary" style={{ width: "100%" }}>
              {busy ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <div className="row-between" style={{ fontSize: 12, color: "var(--muted)" }}>
            <span>Supabase URL + anon key must be set in .env.local.</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMode((prev) => (prev === "signin" ? "signup" : "signin"))}
              type="button"
            >
              {mode === "signin" ? (
                <>
                  <UserPlus style={{ width: 14, height: 14 }} /> Need an account?
                </>
              ) : (
                "Have an account? Sign in"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="card-muted">
        <CardHeader className="stack" style={{ gap: 8 }}>
          <Badge variant="outline">Access policy</Badge>
          <CardTitle className="text-xl">Operator roles</CardTitle>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Profiles live in the `profiles` table. The first login creates a profile with role <code>user</code>; promote to <code>admin</code> directly in Supabase if you need stricter controls.
          </p>
        </CardHeader>
        <CardContent className="stack" style={{ gap: 8, fontSize: 14 }}>
          <div className="row" style={{ gap: 8 }}>
            <ShieldCheck style={{ width: 16, height: 16 }} />
            <span>Sessions are stored as HttpOnly cookies; no client secrets.</span>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <ShieldCheck style={{ width: 16, height: 16 }} />
            <span>Set SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY.</span>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <ShieldCheck style={{ width: 16, height: 16 }} />
            <span>Redirects back to <code>{nextPath}</code> after sign in.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
