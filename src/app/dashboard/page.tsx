"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, Clock3, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type TokenStatus = {
  platform: "tiktok" | "instagram";
  state: "missing" | "expired" | "warning" | "ok";
  expiresAt: string | null;
  daysLeft: number | null;
};

type DashboardData = {
  stats: { scheduled: number; publishing: number; failed: number; published: number };
  upcoming: { id: string; caption: string; schedule_at: string; posts_platform?: { platform: string }[] }[];
  logs: { id: string; level: string; message: string; platform: string | null; created_at: string }[];
  health: {
    lastRunAt: string | null;
    nextRunEta: string | null;
    tokens: { tiktok: boolean; instagram: boolean };
    tokensUpdatedAt: string | null;
    tiktokExpiresAt: string | null;
    instagramExpiresAt: string | null;
    tokenStatuses: TokenStatus[];
  };
};

const steps = [
  { title: "Connect platforms", body: "Paste TikTok/Instagram tokens in Platform Settings." },
  { title: "Upload media", body: "Store assets in the media bucket." },
  { title: "Import JSON plan", body: "Validate schedules, then queue posts." },
  { title: "Verify scheduler", body: "Trigger a test publish and confirm logs." },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [countdown, setCountdown] = useState<string>("--");

  async function loadData(options?: { silent?: boolean }) {
    const silent = options?.silent;
    if (!silent) setLoading(true);
    const response = await fetch("/api/dashboard");
    const text = await response.text();
    if (!silent) setLoading(false);
    let payload: { data?: DashboardData; error?: string } = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      setError("Failed to parse dashboard response");
      return;
    }
    if (!response.ok || !payload.data) {
      setError(payload.error ?? "Failed to load dashboard");
      return;
    }
    setData(payload.data);
    setError(null);
  }

  const loadProfileRole = useCallback(async () => {
    try {
      const response = await fetch("/api/profiles/me");
      if (!response.ok) {
        setIsAdmin(false);
        setProfileLoaded(true);
        return;
      }
      const payload = await response.json();
      const role = payload?.data?.profile?.role ?? "user";
      setIsAdmin(role === "admin");
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadData();
    void loadProfileRole();
  }, [loadProfileRole]);

  useEffect(() => {
    const id = setInterval(() => void loadData({ silent: true }), 20000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!data?.health?.nextRunEta) return;
    const tick = () => {
      const eta = new Date(data.health.nextRunEta as string).getTime();
      const diff = eta - Date.now();
      if (diff <= 0) {
        setCountdown("due");
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${mins}m ${secs}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data?.health?.nextRunEta]);

  async function runPublishCycle() {
    setRunning(true);
    setPublishResult(null);
    const response = await fetch("/api/publish/run", { method: "POST" });
    const payload = await response.json().catch(() => ({}));
    setRunning(false);
    if (!response.ok) {
      setPublishResult(payload.error ?? "Failed to run publish cycle");
      return;
    }
    setPublishResult(`Processed ${payload.data.processed} posts (scanned ${payload.data.scanned})`);
    loadData();
  }

  const statCards = [
    { label: "Scheduled", value: data?.stats.scheduled ?? 0 },
    { label: "Publishing", value: data?.stats.publishing ?? 0 },
    { label: "Failed", value: data?.stats.failed ?? 0 },
  ];

  return (
    <div className="stack" style={{ gap: 18 }}>
      <Card>
        <CardHeader className="stack" style={{ gap: 12 }}>
          <Badge variant="strong">Status overview</Badge>
          <div className="row-between">
            <div className="stack" style={{ gap: 6 }}>
              <CardTitle className="text-2xl">Publishing control center</CardTitle>
              <p style={{ margin: 0, color: "var(--muted)" }}>
                Monitor upcoming posts, review failures, and trigger manual publishes.
              </p>
              {publishResult ? <p style={{ color: "var(--muted)" }}>{publishResult}</p> : null}
              {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
            </div>
            <div className="row" style={{ gap: 10 }}>
              <Button asChild>
                <Link href="/import">Import plan</Link>
              </Button>
              <Button disabled={!isAdmin || running} onClick={runPublishCycle} variant="secondary">
                {running ? "Running..." : isAdmin ? "Run publish cycle" : "Admin only"}
              </Button>
              <Button asChild variant="outline">
                <Link href="/posts">Review posts</Link>
              </Button>
            </div>
          </div>
          {!isAdmin && profileLoaded ? (
            <p style={{ fontSize: 12, color: "var(--muted)" }}>
              You are signed in as a viewer. Admins can trigger publish cycles and update platform tokens.
            </p>
          ) : null}
        </CardHeader>
      </Card>

      <section className="grid-3">
        {statCards.map((item) => (
          <Card key={item.label}>
            <CardHeader className="row-between">
              <CardTitle className="text-sm">{item.label}</CardTitle>
              <Badge>{loading ? "…" : "live"}</Badge>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="" /> : <p style={{ fontSize: 32, margin: 0 }}>{item.value}</p>}
              <p style={{ margin: 0, color: "var(--muted)" }}>Synced from Supabase</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid-3">
        <Card>
          <CardHeader className="row-between">
            <CardTitle className="row" style={{ gap: 6 }}>
              <Clock3 style={{ width: 16, height: 16 }} /> Upcoming
            </CardTitle>
            <Badge>Queue</Badge>
          </CardHeader>
          <CardContent className="stack">
              {loading ? (
              <>
                <Skeleton />
                <Skeleton />
              </>
            ) : data?.upcoming?.length ? (
              data.upcoming.map((item) => (
                <div key={item.id} className="surface section stack" style={{ gap: 6 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{item.caption}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                    {new Date(item.schedule_at).toLocaleString()} —{" "}
                    {item.posts_platform?.map((p) => p.platform).join(", ") || "targets tbd"}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ color: "var(--muted)" }}>No upcoming posts.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="row-between">
            <CardTitle className="row" style={{ gap: 6 }}>
              <Activity style={{ width: 16, height: 16 }} /> Recent logs
            </CardTitle>
          </CardHeader>
          <CardContent className="stack">
              {loading ? (
              <>
                <Skeleton />
                <Skeleton />
              </>
            ) : data?.logs?.length ? (
              data.logs.map((log) => (
                <div key={log.id} className="stack" style={{ gap: 2, borderBottom: "1px solid var(--line)", paddingBottom: 6 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    [{log.level}] {log.message}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                    {new Date(log.created_at).toLocaleString()}
                    {log.platform ? ` • ${log.platform}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ color: "var(--muted)" }}>No publish logs yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="row-between">
            <CardTitle className="row" style={{ gap: 6 }}>
              <AlertTriangle style={{ width: 16, height: 16 }} /> Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="stack">
            <p style={{ margin: 0, color: "var(--muted)" }}>Hook up Supabase and tokens to remove blockers.</p>
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", lineHeight: 1.6 }}>
              <li>Supabase service key required</li>
              <li>TikTok + Instagram access tokens</li>
              <li>Scheduler URL or Supabase cron</li>
            </ul>
            <Button asChild variant="outline" size="sm">
              <Link href="/settings/platforms">Open settings</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="row-between">
          <CardTitle className="row" style={{ gap: 6 }}>
            <Activity style={{ width: 16, height: 16 }} /> Health
          </CardTitle>
          {data?.health?.nextRunEta ? <Badge>Next: {countdown}</Badge> : null}
        </CardHeader>
        <CardContent className="grid-3">
          {data?.health?.tokenStatuses?.map((token) => {
            const variant =
              token.state === "ok" ? "subtle" : token.state === "warning" ? "strong" : "strong";
            const label =
              token.state === "ok"
                ? "Valid"
                : token.state === "warning"
                  ? `Expiring in ${token.daysLeft ?? "?"}d`
                  : token.state === "expired"
                    ? "Expired"
                    : "Missing";
            return (
              <div key={token.platform} className="surface section stack">
                <p style={{ margin: 0, fontWeight: 700, textTransform: "capitalize" }}>{token.platform} token</p>
                <Badge variant={variant}>{label}</Badge>
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                  {token.expiresAt ? `Expires ${new Date(token.expiresAt).toLocaleDateString()}` : "No expiry set"}
                </p>
              </div>
            );
          })}
          <div className="surface section stack">
            <p style={{ margin: 0, fontWeight: 700 }}>Last run</p>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              {data?.health?.lastRunAt ? new Date(data.health.lastRunAt).toLocaleString() : "—"}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
              Tokens updated {data?.health?.tokensUpdatedAt ? new Date(data.health.tokensUpdatedAt).toLocaleString() : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="row" style={{ gap: 6 }}>
            <Play style={{ width: 16, height: 16 }} /> Launch checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid-2">
            {steps.map((step, index) => (
              <div key={step.title} className="surface section stack">
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                  {index + 1}. {step.title}
                </p>
                <p style={{ margin: 0 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
