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
    setSecrets(payload.data?.settings ?? {});
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
    const res = await fetch("/api/platforms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(secrets),
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
          "Enable Content Posting scope, generate client key/secret.",
          "Run OAuth to obtain access_token + refresh_token; set a 60-day refresh schedule.",
          "Paste both tokens here and set the expiry returned by TikTok.",
        ],
      },
      {
        name: "Instagram Graph API",
        steps: [
          "Create a Meta app (Business) and add Instagram Graph + Pages permissions.",
          "Link a Facebook Page to your Instagram Business/Creator account.",
          "Exchange the short-lived user token for a long-lived token (valid ~60 days).",
          "Paste access_token here; store refresh token if you generate one; set the expiry.",
        ],
      },
    ],
    [],
  );

  return (
    <div className="grid gap-6">
      <Card className="shadow-[0_22px_50px_rgba(228,95,163,0.18)]">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">Platform settings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Store platform tokens securely. Only admins can edit; viewer accounts can see status only.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isAdmin ? (
              <>
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span>Admin access</span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                <span>{roleChecked ? "Viewer mode" : "Checking role..."}</span>
              </>
            )}
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-[0_12px_30px_rgba(227,174,255,0.18)]">
          <CardHeader className="space-y-2">
            <Badge className="w-fit" variant="secondary">
              Tokens vault
            </Badge>
            <CardTitle className="text-lg">TikTok + Instagram</CardTitle>
            <p className="text-sm text-muted-foreground">
              Paste current tokens and expiry timestamps. We keep them server-side in Supabase.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">TikTok access token</p>
                  <Badge variant="outline">Required</Badge>
                </div>
                <Textarea
                  disabled={isDisabled}
                  placeholder="access_token"
                  rows={4}
                  value={secrets.tiktok_access_token ?? ""}
                  onChange={(e) => updateField("tiktok_access_token", e.target.value)}
                />
                <Input
                  disabled={isDisabled}
                  placeholder="refresh_token (optional)"
                  value={secrets.tiktok_refresh_token ?? ""}
                  onChange={(e) => updateField("tiktok_refresh_token", e.target.value)}
                />
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Expires at</label>
                  <Input
                    disabled={isDisabled}
                    type="datetime-local"
                    value={dateToInputValue(secrets.tiktok_expires_at)}
                    onChange={(e) => updateField("tiktok_expires_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button disabled={!isAdmin || testing === "tiktok"} onClick={() => handleTest("tiktok")} size="sm" variant="outline">
                    <TestTube2 className="mr-2 h-4 w-4" />
                    {testing === "tiktok" ? "Testing..." : "Test token"}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Instagram access token</p>
                  <Badge variant="outline">Required</Badge>
                </div>
                <Textarea
                  disabled={isDisabled}
                  placeholder="access_token (long-lived)"
                  rows={4}
                  value={secrets.instagram_access_token ?? ""}
                  onChange={(e) => updateField("instagram_access_token", e.target.value)}
                />
                <Input
                  disabled={isDisabled}
                  placeholder="refresh_token (optional)"
                  value={secrets.instagram_refresh_token ?? ""}
                  onChange={(e) => updateField("instagram_refresh_token", e.target.value)}
                />
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Expires at</label>
                  <Input
                    disabled={isDisabled}
                    type="datetime-local"
                    value={dateToInputValue(secrets.instagram_expires_at)}
                    onChange={(e) =>
                      updateField("instagram_expires_at", e.target.value ? new Date(e.target.value).toISOString() : null)
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={!isAdmin || testing === "instagram"}
                    onClick={() => handleTest("instagram")}
                    size="sm"
                    variant="outline"
                  >
                    <TestTube2 className="mr-2 h-4 w-4" />
                    {testing === "instagram" ? "Testing..." : "Test token"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                Last updated: {secrets.updated_at ? new Date(secrets.updated_at).toLocaleString() : "—"}
              </span>
              {!isAdmin && roleChecked ? <Badge variant="outline">View only</Badge> : null}
            </div>

            <div className="flex gap-3">
              <Button disabled={!isAdmin || saving} onClick={handleSave}>
                {saving ? "Saving..." : "Save tokens"}
              </Button>
              <Button disabled={loading} onClick={loadSettings} type="button" variant="outline">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed bg-muted/40 shadow-[0_12px_30px_rgba(247,140,224,0.15)]">
          <CardHeader className="space-y-2">
            <Badge className="w-fit" variant="outline">
              Quick token guides
            </Badge>
            <CardTitle className="text-lg">How to get the API keys fast</CardTitle>
            <p className="text-sm text-muted-foreground">
              Follow these high-level steps; fill the access + refresh tokens above and set the expiry you receive.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {guides.map((guide) => (
              <div key={guide.name} className="rounded-md border bg-background/70 p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="font-medium">{guide.name}</p>
                </div>
                <ol className="ml-4 list-decimal space-y-2 text-muted-foreground">
                  {guide.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Tip: after saving tokens, hit “Test token” to confirm they’re stored; scheduler will surface expiry warnings next.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
