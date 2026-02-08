"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

type PlatformRow = {
  id: string;
  platform: string;
  status: string;
  attempts: number;
  last_error: string | null;
};

type LogRow = {
  id: string;
  level: string;
  message: string;
  created_at: string;
  platform: string | null;
};

type Post = {
  id: string;
  schedule_at: string;
  caption: string;
  media_filename: string | null;
  media_type: string;
  status: string;
  posts_platform: PlatformRow[];
  publish_logs: LogRow[];
};

type Props = {
  initialPost: Post;
};

export function PostDetailClient({ initialPost }: Props) {
  const [post, setPost] = useState<Post>(initialPost);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  async function reload() {
    const response = await fetch(`/api/posts/${post.id}`);
    const text = await response.text();
    try {
      const payload = text ? JSON.parse(text) : {};
      if (response.ok) {
        setPost(payload.data.post);
        setError(null);
      } else {
        setError(payload.error ?? "Failed to refresh");
      }
    } catch {
      setError("Failed to parse response");
    }
  }

  async function callAction(path: string, successMessage: string) {
    setBusy(true);
    setMessage(null);
    setError(null);
    const response = await fetch(path, { method: "POST" });
    const text = await response.text();
    let payload: { error?: string; data?: unknown } = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      // ignore parse error, handled below
    }
    setBusy(false);

    if (!response.ok) {
      const err = payload.error ?? "Action failed";
      setMessage(err);
      setError(err);
      toast({ title: "Action failed", description: err, variant: "destructive" });
      return;
    }

    setMessage(successMessage);
    toast({ title: successMessage });
    await reload();
  }

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/profiles/me");
        if (!response.ok) {
          setIsAdmin(false);
          return;
        }
        const payload = await response.json();
        setIsAdmin((payload?.data?.profile?.role ?? "user") === "admin");
      } finally {
        setProfileLoaded(true);
      }
    })();
  }, []);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="space-y-3">
          <Badge className="w-fit" variant="secondary">
            Post {post.id}
          </Badge>
          <CardTitle>Post details</CardTitle>
          <p className="text-sm text-muted-foreground">{post.caption}</p>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={busy || !isAdmin}
              onClick={() => callAction(`/api/posts/${post.id}/publish`, "Published (manual)")}
            >
              {busy ? "Working..." : isAdmin ? "Publish now" : "Admin only"}
            </Button>
            <Button
              disabled={busy || !isAdmin}
              onClick={() => callAction(`/api/posts/${post.id}/retry`, "Reset to scheduled")}
              variant="outline"
            >
              Retry
            </Button>
            <Button
              disabled={busy || !isAdmin}
              onClick={() => callAction(`/api/posts/${post.id}/disable`, "Post disabled")}
              variant="outline"
            >
              Disable
            </Button>
          </div>
          {!isAdmin && profileLoaded ? (
            <p className="text-xs text-muted-foreground">
              You are in viewer mode. Admins can run publish, retry, or disable actions.
            </p>
          ) : null}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{new Date(post.schedule_at).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {post.posts_platform.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-medium capitalize">{item.platform}</span>
                    {item.last_error ? (
                      <p className="text-xs text-red-600">{item.last_error}</p>
                    ) : null}
                  </div>
                  <Badge variant={item.status === "failed" ? "destructive" : "secondary"}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Media
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {post.media_filename ?? "No filename"} ({post.media_type})
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{post.status}</Badge>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-2 text-sm text-red-600">{error}</p> : null}
          <div className="space-y-3">
            {post.publish_logs?.length ? (
              post.publish_logs.map((log) => (
                <div className="border-b pb-2 text-sm last:border-b-0" key={log.id}>
                  <p className="font-medium">[{log.level}] {log.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                    {log.platform ? ` • ${log.platform}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Publish logs will appear here once execution starts.
              </p>
            )}
          </div>
          <Separator className="my-4" />
          <Button disabled={busy} onClick={reload} size="sm" variant="outline">
            Refresh data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
