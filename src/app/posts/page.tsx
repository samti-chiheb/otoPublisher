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
    <div className="grid gap-6">
      <Card className="shadow-[0_12px_30px_rgba(249,168,212,0.18)]">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <CardTitle>Posts</CardTitle>
            <p className="text-sm text-muted-foreground">
              Filter by status, platform, or date range once data loads.
            </p>
          </div>
          <Button asChild>
            <Link href="/import">Import more</Link>
          </Button>
        </CardHeader>
      </Card>

      <Card className="shadow-[0_12px_30px_rgba(227,174,255,0.18)]">
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 md:grid-cols-4">
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
            <Select
              onValueChange={(value) => setPlatformFilter(value)}
              value={platformFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="md:col-span-2"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search caption…"
              value={query}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Only admins can trigger manual publish/retry; viewers can browse posts.</span>
            {!profileLoaded ? <span className="animate-pulse">Checking role…</span> : null}
          </div>

          <div className="overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Caption</TableHead>
                  <TableHead>Targets</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading &&
                  Array.from({ length: 4 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-64" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!loading &&
                  filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="py-3">
                        {new Date(post.schedule_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="py-3">
                        <Link className="font-medium hover:underline" href={`/posts/${post.id}`}>
                          {post.caption}
                        </Link>
                      </TableCell>
                      <TableCell className="py-3">
                        {post.posts_platform?.map((item) => item.platform).join(", ") ?? "-"}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant={post.status === "failed" ? "destructive" : "secondary"}>
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-red-600">
                        {post.status === "failed"
                          ? post.posts_platform?.find((p) => p.last_error)?.last_error ?? "Error"
                          : ""}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            className="h-8 px-3 text-xs"
                            disabled={loading || busyId === post.id || !isAdmin}
                            variant="secondary"
                            onClick={async (e) => {
                              e.preventDefault();
                              setBusyId(post.id);
                              const res = await fetch(`/api/posts/${post.id}/publish`, {
                                method: "POST",
                              });
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
                                toast({
                                  title: "Publish triggered",
                                  description: "Manual publish started.",
                                });
                                await loadPosts();
                              }
                            }}
                          >
                            {busyId === post.id ? "Working..." : "Publish"}
                          </Button>
                          <Button
                            className="h-8 px-3 text-xs"
                            disabled={loading || busyId === post.id || !isAdmin}
                            variant="outline"
                            onClick={async (e) => {
                              e.preventDefault();
                              setBusyId(post.id);
                              const res = await fetch(`/api/posts/${post.id}/retry`, {
                                method: "POST",
                              });
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
            <p className="text-sm text-muted-foreground">No posts match this filter.</p>
          ) : null}
          {!loading && posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts yet. Import a plan to start.</p>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
