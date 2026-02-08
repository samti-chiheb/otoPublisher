"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle, Clock3, Play } from "lucide-react";

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
  };
};

const steps = [
  {
    title: "Connect platforms",
    body: "Paste TikTok/Instagram tokens in Platform Settings.",
  },
  {
    title: "Upload media",
    body: "Store assets in the Supabase media bucket.",
  },
  {
    title: "Import JSON plan",
    body: "Validate schedules, then queue posts for publishing.",
  },
  {
    title: "Verify scheduler",
    body: "Trigger a test publish and confirm logs.",
  },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

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
    // Initial load.
    void loadData();
    void loadProfileRole();
  }, [loadProfileRole]);

  useEffect(() => {
    const id = setInterval(() => void loadData({ silent: true }), 20000);
    return () => clearInterval(id);
  }, []);

  async function runPublishCycle() {
    setRunning(true);
    setPublishResult(null);

    const response = await fetch("/api/publish/run", { method: "POST" });
    const payload = await response.json();
    setRunning(false);

    if (!response.ok) {
      setPublishResult(payload.error ?? "Failed to run publish cycle");
      return;
    }

    setPublishResult(
      `Processed ${payload.data.processed} posts (scanned ${payload.data.scanned})`,
    );
    loadData();
  }

  const statCards = [
    {
      label: "Scheduled",
      value: data?.stats.scheduled ?? 0,
      accent: "from-[#fbcfe8] to-[#f9a8d4]",
    },
    {
      label: "Publishing",
      value: data?.stats.publishing ?? 0,
      accent: "from-[#c4b5fd] to-[#a5b4fc]",
    },
    {
      label: "Failed",
      value: data?.stats.failed ?? 0,
      accent: "from-[#fecdd3] to-[#fda4af]",
    },
  ];

  const health = data?.health;
  const [countdown, setCountdown] = useState<string>("--");

  useEffect(() => {
    if (!health?.nextRunEta) return;
    const tick = () => {
      const eta = new Date(health.nextRunEta as string).getTime();
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
  }, [health?.nextRunEta]);


  return (
    <div className="grid gap-6">
      <Card className="shadow-[0_22px_50px_rgba(228,95,163,0.18)]">
        <CardHeader className="space-y-3">
          <Badge className="w-fit" variant="secondary">
            Status Overview
          </Badge>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-3xl">Publishing control center</CardTitle>
              <p className="max-w-xl text-sm text-muted-foreground">
                Monitor upcoming posts, review failures, and trigger manual publishes
                while the scheduler runs every minute.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/import">Import plan</Link>
              </Button>
              <div className="flex items-center gap-2">
                <Button disabled={!isAdmin || running} onClick={runPublishCycle} variant="secondary">
                  {running ? "Running..." : isAdmin ? "Run publish cycle" : "Admin only"}
                </Button>
                {health?.nextRunEta ? (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                    Next: {countdown}
                  </span>
                ) : null}
              </div>
              <Button asChild variant="outline">
                <Link href="/posts">Review posts</Link>
              </Button>
            </div>
          </div>
          {!isAdmin && profileLoaded ? (
            <p className="text-xs text-muted-foreground">
              You are signed in as a viewer. Admins can trigger publish cycles and update platform tokens.
            </p>
          ) : null}
          {publishResult ? (
            <p className="text-sm text-muted-foreground">{publishResult}</p>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {statCards.map((item) => (
          <Card key={item.label} className="overflow-hidden">
            <div className={`h-1 w-full bg-gradient-to-r ${item.accent}`} />
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <div className="rounded-full bg-accent-soft px-2 py-1 text-[11px] font-medium text-primary">
                live
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <p className="text-4xl font-semibold">{item.value}</p>
              )}
              <p className="text-sm text-muted-foreground">Synced from Supabase.</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock3 className="h-4 w-4" /> Upcoming
            </CardTitle>
            <Badge variant="secondary">Queue</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : data?.upcoming.length ? (
              <div className="space-y-2 text-sm">
                {data.upcoming.map((item) => (
                  <div key={item.id} className="rounded-md border p-3">
                    <p className="font-medium">{item.caption}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.schedule_at).toLocaleString()} —
                      {" "}
                      {item.posts_platform?.map((p) => p.platform).join(", ") || "targets tbd"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming posts.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" /> Recent logs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </>
            ) : data?.logs.length ? (
              <div className="space-y-2 text-sm">
                {data.logs.map((log) => (
                  <div className="border-b pb-2 last:border-b-0" key={log.id}>
                    <p className="font-medium">
                      [{log.level}] {log.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                      {log.platform ? ` • ${log.platform}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No publish logs yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" /> Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Hook up Supabase and tokens to remove blockers.
            </p>
            <ul className="list-disc space-y-2 pl-4 text-sm">
              <li>Supabase service key required</li>
              <li>TikTok + Instagram access tokens</li>
              <li>Scheduler URL or Supabase cron</li>
            </ul>
            <Button asChild size="sm" variant="outline">
              <Link href="/settings/platforms">Open settings</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" /> Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {health ? (
              <>
                {!(health.tokens.tiktok && health.tokens.instagram) ? (
                  <p className="text-xs text-red-600">One or more platform tokens are missing.</p>
                ) : null}
                <div className="flex items-center justify-between">
                  <span>Last run</span>
                  <span className="text-muted-foreground text-xs">
                    {health.lastRunAt
                      ? new Date(health.lastRunAt).toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Next run ETA</span>
                  <span>
                    {health.nextRunEta
                      ? new Date(health.nextRunEta).toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Countdown</span>
                  <span>{countdown}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>TikTok token</span>
                  <Badge variant={health.tokens.tiktok ? "secondary" : "destructive"}>
                    {health.tokens.tiktok ? "Present" : "Missing"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Instagram token</span>
                  <Badge
                    variant={health.tokens.instagram ? "secondary" : "destructive"}
                  >
                    {health.tokens.instagram ? "Present" : "Missing"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tokens updated</span>
                  <span>
                    {health.tokensUpdatedAt
                      ? new Date(health.tokensUpdatedAt).toLocaleString()
                      : "—"}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Health data not available.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Play className="h-4 w-4" /> Launch checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {steps.map((step, index) => (
              <div key={step.title} className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {index + 1}. {step.title}
                </p>
                <p className="text-sm">{step.body}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
