"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, LogOut, Shield, UserCog } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    const id = requestAnimationFrame(() => {
      void loadProfile();
    });
    return () => cancelAnimationFrame(id);
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
    <div className="grid-2" style={{ alignItems: "start" }}>
      <Card>
        <CardHeader className="stack" style={{ gap: 8 }}>
          <Badge>Your account</Badge>
          <CardTitle className="text-2xl">Profile & Identity</CardTitle>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Update the name and photo teammates see on posts and activity. Roles decide who can change tokens.
          </p>
        </CardHeader>
        <CardContent className="stack" style={{ gap: 14 }}>
          {loading ? (
            <div className="stack">
              <div className="field" style={{ height: 40, background: "rgba(15,23,42,0.05)" }} />
              <div className="field" style={{ height: 40, background: "rgba(15,23,42,0.05)" }} />
              <div className="field" style={{ height: 40, width: 180, background: "rgba(15,23,42,0.05)" }} />
            </div>
          ) : (
            <>
              <div className="surface section row-between">
                <div className="row" style={{ gap: 12 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: "linear-gradient(135deg, #ffcee9, #ffe6aa)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="Avatar" src={avatarPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Camera style={{ width: 20, height: 20 }} />
                    )}
                  </div>
                  <div className="stack" style={{ gap: 2 }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>{profile?.display_name || "Set your name"}</p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      {profile?.username ? `@${profile.username}` : "Add a username"}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{email ?? "—"}</p>
                  </div>
                </div>
                <Badge variant="strong">{role}</Badge>
              </div>

              <div className="stack" style={{ gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Business / brand name</label>
                <Input
                  onChange={(event) =>
                    setProfile((prev) => (prev ? { ...prev, business_name: event.target.value } : prev))
                  }
                  placeholder="Sunrise Studio"
                  value={profile?.business_name ?? ""}
                />
              </div>

              <div className="stack" style={{ gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Display name</label>
                <Input
                  onChange={(event) => setProfile((prev) => (prev ? { ...prev, display_name: event.target.value } : prev))}
                  placeholder="Your name"
                  value={profile?.display_name ?? ""}
                />
              </div>

              <div className="stack" style={{ gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Username</label>
                <Input
                  onChange={(event) => setProfile((prev) => (prev ? { ...prev, username: event.target.value } : prev))}
                  placeholder="@handle"
                  value={profile?.username ?? ""}
                />
              </div>

              <div className="stack" style={{ gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Timezone</label>
                <Select
                  onValueChange={(value) => setProfile((prev) => (prev ? { ...prev, timezone: value } : prev))}
                  value={profile?.timezone ?? "UTC"}
                >
                  <SelectTrigger>
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
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Scheduling uses this timezone.</p>
              </div>

              <div className="row-between surface section">
                <div className="stack" style={{ gap: 2 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>Email me on failures</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                    We’ll send a quick heads-up if a post can’t publish.
                  </p>
                </div>
                <input
                  checked={profile?.notify_on_fail ?? true}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, notify_on_fail: e.target.checked } : prev))
                  }
                  type="checkbox"
                  style={{ width: 18, height: 18 }}
                />
              </div>

              <div className="stack" style={{ gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Email</label>
                <div className="field" style={{ background: "#f1f5f9" }}>
                  {email ?? "—"}
                </div>
              </div>

              <div className="stack" style={{ gap: 8 }}>
                <div className="row" style={{ gap: 8 }}>
                  <Shield style={{ width: 16, height: 16 }} /> <span style={{ fontSize: 13 }}>Role</span>
                </div>
                <div className="field" style={{ background: "#f1f5f9" }}>
                  {role === "admin" ? "Admin (can manage tokens)" : "Viewer (no token changes)"}
                </div>
              </div>

              <div className="row" style={{ gap: 10 }}>
                <Button onClick={handleSave} disabled={saving || loading}>
                  {saving ? "Saving..." : "Save profile"}
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut style={{ width: 16, height: 16 }} />
                  Sign out
                </Button>
              </div>
              {message ? <p style={{ color: "var(--muted)" }}>{message}</p> : null}
              {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="card-muted">
        <CardHeader className="stack" style={{ gap: 8 }}>
          <Badge variant="strong">Tips</Badge>
          <CardTitle>Make your profile delightful</CardTitle>
        </CardHeader>
        <CardContent className="stack" style={{ gap: 10 }}>
          <div className="row" style={{ gap: 8 }}>
            <UserCog style={{ width: 16, height: 16 }} /> Add a friendly display name and username so teammates recognize you.
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Camera style={{ width: 16, height: 16 }} /> Upload an avatar URL (public link) to appear in logs.
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Shield style={{ width: 16, height: 16 }} /> Only admins can edit platform tokens; ask an admin to promote you if needed.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
