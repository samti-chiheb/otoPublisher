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
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/profiles/me");
      const payload = await response.json();
      if (response.ok && payload?.data?.profile) {
        setProfile(payload.data.profile as Profile);
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setProfile(null);
        router.refresh();
        return;
      }
      void loadProfile();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [loadProfile, router, supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setProfile(null);
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return <div className="h-10 w-44 animate-pulse rounded-md bg-muted" />;
  }

  if (!profile) {
    return (
      <Button asChild variant="outline">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  const label = profile.display_name || "Operator";

  return (
    <div className="flex items-center gap-2">
      <Button asChild size="sm" variant="ghost" className="rounded-full border bg-muted px-3">
        <Link className="flex items-center gap-2 text-sm font-medium" href="/profile">
          <UserRound className="h-3.5 w-3.5" />
          <span>{label}</span>
        </Link>
      </Button>
      <Button onClick={handleSignOut} size="sm" variant="secondary">
        <LogOut className="mr-2 h-3.5 w-3.5" />
        Sign out
      </Button>
    </div>
  );
}
