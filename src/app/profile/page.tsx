"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, LogOut, Shield, UserCog } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  business_name: string | null;
  timezone: string | null;
  notify_on_fail: boolean | null;
  avatar_url: string | null;
  role: string | null;
};

export default function ProfilePage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const commonTimezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Dubai",
    "Asia/Singapore",
  ];

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    setEmail(session.user.email ?? null);

    const response = await fetch("/api/profiles/me");
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Failed to load profile");
      setLoading(false);
      return;
    }

    setProfile(payload.data.profile);
    setAvatarPreview(payload.data.profile?.avatar_url ?? null);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfile();
  }, [loadProfile]);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/profiles/me", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        display_name: profile.display_name,
        business_name: profile.business_name,
        timezone: profile.timezone,
        notify_on_fail: profile.notify_on_fail,
        avatar_url: profile.avatar_url,
        role: profile.role,
        username: profile.username,
      }),
    });

    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to save profile");
      return;
    }

    setProfile(payload.data.profile);
    setAvatarPreview(payload.data.profile.avatar_url ?? null);
    setMessage("Profile saved");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const role = profile?.role ?? "user";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="shadow-[0_18px_40px_rgba(247,140,224,0.18)]">
        <CardHeader className="space-y-3">
          <Badge className="w-fit" variant="secondary">
            Your account
          </Badge>
          <CardTitle className="text-2xl">Profile & Identity</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update the name and photo teammates see on posts and activity. Roles decide who can change tokens.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <div className="space-y-3">
              <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
              <div className="h-10 w-40 animate-pulse rounded-md bg-muted" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 rounded-md border bg-muted/40 p-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-primary/40">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="Avatar" className="h-full w-full object-cover" src={avatarPreview} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-primary">
                      <Camera className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-foreground">
                    {profile?.display_name || "Set your name"}
                  </p>
                  <p className="text-muted-foreground">
                    {profile?.username ? `@${profile.username}` : "Add a username"}
                  </p>
                  <p className="text-muted-foreground">{email ?? "—"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="business-name">
                  Business / brand name
                </label>
                <Input
                  id="business-name"
                  onChange={(event) =>
                    setProfile((prev) =>
                      prev ? { ...prev, business_name: event.target.value } : prev,
                    )
                  }
                  placeholder="Sunrise Studio"
                  value={profile?.business_name ?? ""}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Timezone</label>
                <Select
                  onValueChange={(value) =>
                    setProfile((prev) => (prev ? { ...prev, timezone: value } : prev))
                  }
                  value={profile?.timezone ?? "UTC"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonTimezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Scheduling uses this timezone for future posts.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Email me on failures</p>
                  <p className="text-xs text-muted-foreground">We’ll send a quick heads-up if a post can’t publish.</p>
                </div>
                <input
                  checked={profile?.notify_on_fail ?? true}
                  className="h-4 w-4 accent-primary"
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, notify_on_fail: e.target.checked } : prev,
                    )
                  }
                  type="checkbox"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                  {email ?? "—"}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="display-name">
                  Name
                </label>
                <Input
                  id="display-name"
                  onChange={(event) =>
                    setProfile((prev) =>
                      prev ? { ...prev, display_name: event.target.value } : prev,
                    )
                  }
                  placeholder="Content ops"
                  value={profile?.display_name ?? ""}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="username">
                  Username
                </label>
                <Input
                  id="username"
                  onChange={(event) =>
                    setProfile((prev) =>
                      prev ? { ...prev, username: event.target.value } : prev,
                    )
                  }
                  placeholder="@yourhandle"
                  value={profile?.username ?? ""}
                />
                <p className="text-xs text-muted-foreground">
                  Used in activity logs and future team mentions.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="avatar-url">
                  Avatar URL (optional)
                </label>
                <Input
                  id="avatar-url"
                  onChange={(event) =>
                    setProfile((prev) =>
                      prev ? { ...prev, avatar_url: event.target.value } : prev,
                    )
                  }
                  placeholder="https://images.example/avatar.png"
                  value={profile?.avatar_url ?? ""}
                />
                <p className="text-xs text-muted-foreground">
                  Paste an image link. We’ll show a preview above.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select
                  onValueChange={(value) =>
                    setProfile((prev) => (prev ? { ...prev, role: value } : prev))
                  }
                  value={role}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {message ? <p className="text-sm text-green-700">{message}</p> : null}
              <div className="flex flex-wrap gap-3">
                <Button disabled={saving} onClick={handleSave}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
                <Button onClick={handleSignOut} type="button" variant="outline">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed bg-muted/40 shadow-[0_12px_30px_rgba(227,174,255,0.15)]">
        <CardHeader className="space-y-3">
          <Badge className="w-fit" variant="outline">
            Access controls
          </Badge>
          <CardTitle className="text-xl">How roles work</CardTitle>
          <p className="text-sm text-muted-foreground">
            Roles keep tokens safe. Use <code>admin</code> for people who can edit platform tokens and trigger runs.
            Keep <code>user</code> for schedulers who just need to view and manage posts.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>Sessions sync via Supabase cookies; no custom JWT wiring needed.</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-primary" />
            <span>Profiles auto-provision after first login.</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>Future: enforce <code>admin</code> for publisher actions.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
