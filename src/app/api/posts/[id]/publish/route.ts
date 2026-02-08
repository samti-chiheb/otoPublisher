import { fail, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth/guard";
import { logPublishEvent, publishToInstagram, publishToTikTok } from "@/lib/publishers";
import { statusFromPlatformStatuses } from "@/lib/posts";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: RouteParams) {
  const unauthorized = await requireAdminApi({ allowedRoles: ["admin"] });
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, caption, media_url, storage_path, media_type, status")
    .eq("id", id)
    .single();

  if (postError || !post) return fail("Post not found", 404, postError?.message);

  if (!post.media_url && !post.storage_path) {
    return fail("Missing media for this post", 422);
  }

  await supabase.from("posts").update({ status: "publishing" }).eq("id", id);
  await logPublishEvent(id, "info", "Manual publish requested");

  const { data: platformRows, error: platformError } = await supabase
    .from("posts_platform")
    .select("id, platform, status, attempts")
    .eq("post_id", id);

  if (platformError) return fail("Unable to load platform rows", 500, platformError.message);

  for (const target of platformRows ?? []) {
    if (target.status === "published") continue;

    await supabase
      .from("posts_platform")
      .update({ status: "publishing", attempts: (target.attempts ?? 0) + 1 })
      .eq("id", target.id);

    try {
      const result =
        target.platform === "instagram"
          ? await publishToInstagram({
              postId: id,
              platform: "instagram",
              caption: post.caption,
              mediaUrl: post.media_url,
              storagePath: post.storage_path,
              mediaType: post.media_type,
            })
          : await publishToTikTok({
              postId: id,
              platform: "tiktok",
              caption: post.caption,
              mediaUrl: post.media_url,
              storagePath: post.storage_path,
              mediaType: post.media_type,
            });

      await supabase
        .from("posts_platform")
        .update({
          status: "published",
          platform_post_id: result.platformPostId,
          platform_url: result.platformUrl,
          published_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", target.id);

      await logPublishEvent(id, "info", "Platform publish succeeded", target.platform, result);
    } catch (publishError) {
      const message = publishError instanceof Error ? publishError.message : "Unknown error";
      await supabase
        .from("posts_platform")
        .update({ status: "failed", last_error: message })
        .eq("id", target.id);
      await logPublishEvent(id, "error", "Platform publish failed", target.platform, {
        message,
      });
    }
  }

  const { data: finalPlatforms } = await supabase
    .from("posts_platform")
    .select("status")
    .eq("post_id", id);

  const finalStatus = statusFromPlatformStatuses(
    (finalPlatforms ?? []).map((item) => item.status),
  );

  await supabase.from("posts").update({ status: finalStatus }).eq("id", id);

  return ok({ status: finalStatus });
}
