import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { PostDetailClient } from "./PostDetailClient";

type RouteParams = { params: Promise<{ id: string }> };

export default async function PostDetailPage({ params }: RouteParams) {
  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  const { data: post, error } = await supabase
    .from("posts")
    .select(
      "id, schedule_at, caption, media_filename, media_type, status, posts_platform(*), publish_logs(*)",
    )
    .eq("id", id)
    .single();

  if (error || !post) {
    return <p className="text-sm text-red-600">Post not found.</p>;
  }

  return <PostDetailClient initialPost={post} />;
}
