"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Profile = {
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

export function UserMenu() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/profiles/me");
      const payload = await res.json();
      setProfile(payload?.data?.profile ?? null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadProfile();
    const { data: authListener } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!session) {
        setProfile(null);
        router.refresh();
        return;
      }
      void loadProfile();
    });
    return () => authListener?.subscription.unsubscribe();
  }, [loadProfile, router, supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setProfile(null);
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return <div className="pill">Loading...</div>;
  }

  if (!profile) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  const label = profile.display_name || "Operator";

  return (
    <div className="row">
      <Button asChild variant="ghost" size="sm" className="row gap-2">
        <Link href="/profile">
          <UserRound className="h-4 w-4" />
          {label}
        </Link>
      </Button>
      <Button onClick={handleSignOut} size="sm" variant="secondary">
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}
