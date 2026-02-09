"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type ApiPost = {
  id: string;
  caption: string;
  schedule_at: string;
  status: string;
  posts_platform?: { platform: string; last_error?: string | null }[];
};

export default function PostsPage() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [query, setQuery] = useState<string>("");
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const loadPosts = useCallback(async () => {
    const response = await fetch("/api/posts");
    const text = await response.text();

    let payload: { data?: { posts?: ApiPost[] }; error?: string } = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      setError("Failed to parse posts response");
      setLoading(false);
      return;
    }

    if (!response.ok) {
      setError(payload.error ?? "Failed to load posts");
      setLoading(false);
      return;
    }

    setPosts(payload.data?.posts ?? []);
    setLoading(false);
  }, []);

  const loadProfileRole = useCallback(async () => {
    const response = await fetch("/api/profiles/me");
    if (!response.ok) {
      setIsAdmin(false);
      setProfileLoaded(true);
      return;
    }
    const payload = await response.json();
    const role = payload?.data?.profile?.role ?? "user";
    setIsAdmin(role === "admin");
    setProfileLoaded(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPosts();
    void loadProfileRole();
  }, [loadPosts, loadProfileRole]);

  const filteredPosts = posts.filter((post) => {
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    const matchesPlatform =
      platformFilter === "all" ||
      (post.posts_platform ?? []).some((p) => p.platform === platformFilter);
    const matchesQuery =
      query.trim().length === 0 ||
      post.caption.toLowerCase().includes(query.toLowerCase());
    return matchesStatus && matchesPlatform && matchesQuery;
  });

  return (
    <div className="stack" style={{ gap: 18 }}>
      <Card>
        <CardHeader className="row-between">
          <div className="stack" style={{ gap: 6 }}>
            <CardTitle>Posts</CardTitle>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Filter by status, platform, or search caption.
            </p>
          </div>
          <Button asChild>
            <Link href="/import">Import more</Link>
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="stack" style={{ gap: 16 }}>
          <div className="grid-3" style={{ alignItems: "flex-start" }}>
            <Select onValueChange={(value) => setStatusFilter(value)} value={statusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="publishing">Publishing</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setPlatformFilter(value)} value={platformFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
            <Input onChange={(event) => setQuery(event.target.value)} placeholder="Search caption…" value={query} />
          </div>

          <div className="row-between" style={{ fontSize: 12, color: "var(--muted)" }}>
            <span>Only admins can trigger manual publish/retry; viewers can browse posts.</span>
            {!profileLoaded ? <span>Checking role…</span> : null}
          </div>

          <div className="table-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Caption</TableHead>
                  <TableHead>Targets</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading &&
                  Array.from({ length: 4 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Skeleton className="" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!loading &&
                  filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>{new Date(post.schedule_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Link href={`/posts/${post.id}`} style={{ fontWeight: 600 }}>
                          {post.caption}
                        </Link>
                      </TableCell>
                      <TableCell>{post.posts_platform?.map((item) => item.platform).join(", ") ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={post.status === "failed" ? "strong" : "subtle"}>{post.status}</Badge>
                      </TableCell>
                      <TableCell style={{ fontSize: 12, color: "#b91c1c" }}>
                        {post.status === "failed"
                          ? post.posts_platform?.find((p) => p.last_error)?.last_error ?? "Error"
                          : ""}
                      </TableCell>
                      <TableCell>
                        <div className="row" style={{ justifyContent: "flex-end" }}>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={loading || busyId === post.id || !isAdmin}
                            onClick={async (e) => {
                              e.preventDefault();
                              setBusyId(post.id);
                              const res = await fetch(`/api/posts/${post.id}/publish`, { method: "POST" });
                              const text = await res.text();
                              let payload: { error?: string } = {};
                              try {
                                payload = text ? JSON.parse(text) : {};
                              } catch {}
                              setBusyId(null);
                              if (!res.ok) {
                                toast({
                                  title: "Publish failed",
                                  description: payload.error ?? "Request failed",
                                  variant: "destructive",
                                });
                              } else {
                                toast({ title: "Publish triggered", description: "Manual publish started." });
                                await loadPosts();
                              }
                            }}
                          >
                            {busyId === post.id ? "Working..." : "Publish"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={loading || busyId === post.id || !isAdmin}
                            onClick={async (e) => {
                              e.preventDefault();
                              setBusyId(post.id);
                              const res = await fetch(`/api/posts/${post.id}/retry`, { method: "POST" });
                              const text = await res.text();
                              let payload: { error?: string } = {};
                              try {
                                payload = text ? JSON.parse(text) : {};
                              } catch {}
                              setBusyId(null);
                              if (!res.ok) {
                                toast({
                                  title: "Retry failed",
                                  description: payload.error ?? "Request failed",
                                  variant: "destructive",
                                });
                              } else {
                                toast({ title: "Post reset to scheduled" });
                                await loadPosts();
                              }
                            }}
                          >
                            Retry
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {!loading && filteredPosts.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No posts match this filter.</p>
          ) : null}
          {!loading && posts.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No posts yet. Import a plan to start.</p>
          ) : null}
          {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
