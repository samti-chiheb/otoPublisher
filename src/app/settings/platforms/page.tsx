"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldAlert, ShieldCheck, Sparkles, TestTube2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type PlatformSecrets = {
  tiktok_access_token?: string | null;
  tiktok_refresh_token?: string | null;
  tiktok_expires_at?: string | null;
  instagram_access_token?: string | null;
  instagram_refresh_token?: string | null;
  instagram_expires_at?: string | null;
  updated_at?: string | null;
  meta?: Record<string, unknown> | null;
  instagram_user_id?: string | null;
  tiktok_user_id?: string | null;
};

type Role = "admin" | "user";

const dateToInputValue = (iso: string | null | undefined) =>
  iso ? new Date(iso).toISOString().slice(0, 16) : "";

export default function PlatformSettingsPage() {
  const { toast } = useToast();
  const [secrets, setSecrets] = useState<PlatformSecrets>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const [testing, setTesting] = useState<"tiktok" | "instagram" | null>(null);

  const isDisabled = saving || testing !== null || !isAdmin;

  const tokenStatuses = useMemo(() => {
    const compute = (platform: "tiktok" | "instagram", token?: string | null, expires?: string | null) => {
      if (!token) return { platform, state: "missing", label: "Missing" };
      if (!expires) return { platform, state: "ok", label: "Valid" };
      const diff = new Date(expires).getTime() - Date.now();
      const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (diff <= 0) return { platform, state: "expired", label: "Expired" };
      if (daysLeft <= 10) return { platform, state: "warning", label: `Expiring in ${daysLeft}d` };
      return { platform, state: "ok", label: `Valid · ${daysLeft}d` };
    };
    return [
      compute("tiktok", secrets.tiktok_access_token, secrets.tiktok_expires_at),
      compute("instagram", secrets.instagram_access_token, secrets.instagram_expires_at),
    ];
  }, [secrets.instagram_access_token, secrets.instagram_expires_at, secrets.tiktok_access_token, secrets.tiktok_expires_at]);

  const loadRole = useCallback(async () => {
    try {
      const res = await fetch("/api/profiles/me");
      if (!res.ok) {
        setIsAdmin(false);
        return;
      }
      const payload = await res.json();
      const role = (payload?.data?.profile?.role ?? "user") as Role;
      setIsAdmin(role === "admin");
    } finally {
      setRoleChecked(true);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/platforms");
    const text = await res.text();
    let payload: { data?: { settings?: PlatformSecrets }; error?: string } = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      toast({ title: "Error", description: "Failed to parse settings response", variant: "destructive" });
      setLoading(false);
      return;
    }
    if (!res.ok) {
      toast({ title: "Error", description: payload.error ?? "Unable to load settings", variant: "destructive" });
      setLoading(false);
      return;
    }
    const settings = payload.data?.settings ?? {};
    setSecrets({
      ...settings,
      instagram_user_id: settings.meta?.instagram_user_id ?? "",
      tiktok_user_id: settings.meta?.tiktok_user_id ?? "",
    });
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void loadRole();
    void loadSettings();
  }, [loadRole, loadSettings]);

  const updateField = useCallback(<K extends keyof PlatformSecrets>(key: K, value: PlatformSecrets[K]) => {
    setSecrets((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const meta = {
      instagram_user_id: secrets.instagram_user_id || null,
      tiktok_user_id: secrets.tiktok_user_id || null,
      ...(secrets.meta ?? {}),
    };
    const res = await fetch("/api/platforms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...secrets, meta }),
    });
    const payload = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Save failed", description: payload.error ?? "Request failed", variant: "destructive" });
      return;
    }
    toast({ title: "Saved", description: "Tokens stored securely." });
    void loadSettings();
  }, [loadSettings, secrets, toast]);

  const handleTest = useCallback(
    async (platform: "tiktok" | "instagram") => {
      setTesting(platform);
      const res = await fetch("/api/platforms/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      const payload = await res.json().catch(() => ({}));
      setTesting(null);
      if (!res.ok) {
        toast({ title: "Test failed", description: payload.error ?? "Request failed", variant: "destructive" });
        return;
      }
      toast({
        title: `${platform} token`,
        description: payload.data?.configured ? "Token found in vault" : "No token stored",
        variant: payload.data?.configured ? "default" : "destructive",
      });
    },
    [toast],
  );

  const guides = useMemo(
    () => [
      {
        name: "TikTok (Business API)",
        steps: [
          "Create an app at https://developers.tiktok.com → App Console.",
          "Enable Content Posting scope; note client key/secret.",
          "Run OAuth to obtain access_token + refresh_token (60-day).",
          "Paste both tokens; set expiry; add advertiser/user id in meta.",
        ],
      },
      {
        name: "Instagram Graph API",
        steps: [
          "Create a Meta app (Business) and add Instagram Graph + Pages permissions.",
          "Link a Facebook Page to your Instagram Business/Creator account.",
          "Exchange the short-lived user token for a long-lived token (valid ~60 days).",
          "Paste access_token; set expiry; add Instagram business_user_id.",
        ],
      },
    ],
    [],
  );

  return (
    <div className="stack" style={{ gap: 18 }}>
      <Card>
        <CardHeader className="row-between">
          <div className="stack" style={{ gap: 6 }}>
            <CardTitle className="text-2xl">Platform settings</CardTitle>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Store platform tokens securely. Only admins can edit; viewers can see status only.
            </p>
          </div>
          <div className="row" style={{ gap: 8, color: "var(--muted)", fontSize: 12 }}>
            {isAdmin ? (
              <>
                <ShieldCheck style={{ width: 16, height: 16 }} /> Admin access
              </>
            ) : (
              <>
                <ShieldAlert style={{ width: 16, height: 16 }} /> {roleChecked ? "Viewer mode" : "Checking role..."}
              </>
            )}
          </div>
        </CardHeader>
      </Card>

      <section className="grid-2">
        <Card>
          <CardHeader className="stack" style={{ gap: 8 }}>
            <Badge variant="subtle">Tokens vault</Badge>
            <CardTitle>TikTok + Instagram</CardTitle>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Paste current tokens and expiry timestamps. We keep them server-side in Supabase.
            </p>
          </CardHeader>
          <CardContent className="stack" style={{ gap: 16 }}>
            <div className="grid-2">
              <div className="stack" style={{ gap: 10 }}>
                <div className="row-between">
                  <p style={{ margin: 0, fontWeight: 600 }}>TikTok access token</p>
                  <div className="row" style={{ gap: 6 }}>
                    <Badge>Required</Badge>
                    <Badge variant={tokenStatuses[0].state === "ok" ? "subtle" : "strong"}>
                      {tokenStatuses[0].label}
                    </Badge>
                  </div>
                </div>
                <Textarea
                  disabled={isDisabled}
                  placeholder="access_token"
                  rows={3}
                  value={secrets.tiktok_access_token ?? ""}
                  onChange={(e) => updateField("tiktok_access_token", e.target.value)}
                />
                <Input
                  disabled={isDisabled}
                  placeholder="refresh_token (optional)"
                  value={secrets.tiktok_refresh_token ?? ""}
                  onChange={(e) => updateField("tiktok_refresh_token", e.target.value)}
                />
                <Input
                  disabled={isDisabled}
                  placeholder="TikTok user_id / advertiser_id (optional)"
                  value={secrets.tiktok_user_id ?? ""}
                  onChange={(e) => updateField("tiktok_user_id", e.target.value)}
                />
                <div className="stack" style={{ gap: 4 }}>
                  <label style={{ fontSize: 12, color: "var(--muted)" }}>Expires at</label>
                  <Input
                    disabled={isDisabled}
                    type="datetime-local"
                    value={dateToInputValue(secrets.tiktok_expires_at)}
                    onChange={(e) => updateField("tiktok_expires_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                  />
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <Button disabled={!isAdmin || testing === "tiktok"} onClick={() => handleTest("tiktok")} size="sm" variant="outline">
                    <TestTube2 style={{ width: 16, height: 16 }} />
                    {testing === "tiktok" ? "Testing..." : "Test token"}
                  </Button>
                </div>
              </div>

              <div className="stack" style={{ gap: 10 }}>
                <div className="row-between">
                  <p style={{ margin: 0, fontWeight: 600 }}>Instagram access token</p>
                  <div className="row" style={{ gap: 6 }}>
                    <Badge>Required</Badge>
                    <Badge variant={tokenStatuses[1].state === "ok" ? "subtle" : "strong"}>
                      {tokenStatuses[1].label}
                    </Badge>
                  </div>
                </div>
                <Textarea
                  disabled={isDisabled}
                  placeholder="access_token (long-lived)"
                  rows={3}
                  value={secrets.instagram_access_token ?? ""}
                  onChange={(e) => updateField("instagram_access_token", e.target.value)}
                />
                <Input
                  disabled={isDisabled}
                  placeholder="refresh_token (optional)"
                  value={secrets.instagram_refresh_token ?? ""}
                  onChange={(e) => updateField("instagram_refresh_token", e.target.value)}
                />
                <Input
                  disabled={isDisabled}
                  placeholder="Instagram business user_id"
                  value={secrets.instagram_user_id ?? ""}
                  onChange={(e) => updateField("instagram_user_id", e.target.value)}
                />
                <div className="stack" style={{ gap: 4 }}>
                  <label style={{ fontSize: 12, color: "var(--muted)" }}>Expires at</label>
                  <Input
                    disabled={isDisabled}
                    type="datetime-local"
                    value={dateToInputValue(secrets.instagram_expires_at)}
                    onChange={(e) =>
                      updateField("instagram_expires_at", e.target.value ? new Date(e.target.value).toISOString() : null)
                    }
                  />
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <Button disabled={!isAdmin || testing === "instagram"} onClick={() => handleTest("instagram")} size="sm" variant="outline">
                    <TestTube2 style={{ width: 16, height: 16 }} />
                    {testing === "instagram" ? "Testing..." : "Test token"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="row" style={{ gap: 10, fontSize: 12, color: "var(--muted)" }}>
              <span>Last updated: {secrets.updated_at ? new Date(secrets.updated_at).toLocaleString() : "—"}</span>
              {!isAdmin && roleChecked ? <Badge>View only</Badge> : null}
            </div>

            <div className="row" style={{ gap: 10 }}>
              <Button disabled={!isAdmin || saving} onClick={handleSave}>
                {saving ? "Saving..." : "Save tokens"}
              </Button>
              <Button disabled={loading} onClick={loadSettings} type="button" variant="outline">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-muted">
          <CardHeader className="stack" style={{ gap: 8 }}>
            <Badge variant="outline">Quick token guides</Badge>
            <CardTitle>How to get the API keys fast</CardTitle>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Follow these high-level steps; fill the access + refresh tokens above and set the expiry you receive.
            </p>
          </CardHeader>
          <CardContent className="stack" style={{ gap: 12 }}>
            {guides.map((guide) => (
              <div key={guide.name} className="surface section stack">
                <div className="row" style={{ gap: 8 }}>
                  <Sparkles style={{ width: 16, height: 16 }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>{guide.name}</p>
                </div>
                <ol style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", lineHeight: 1.6 }}>
                  {guide.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>
              Tip: after saving tokens, hit “Test token” to confirm they’re stored; scheduler will surface expiry warnings.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
