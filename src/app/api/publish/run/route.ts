import { fail, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth/guard";
import {
  logPublishEvent,
  publishToInstagram,
  publishToTikTok,
} from "@/lib/publishers";
import { statusFromPlatformStatuses } from "@/lib/posts";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { loadTokenStatuses, refreshTokensIfNeeded } from "@/lib/platforms";

const DEFAULT_MAX_ATTEMPTS = Number(process.env.PUBLISH_MAX_ATTEMPTS ?? 3);
const LEASE_SECONDS = 30;

export async function POST(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret && secret === env.adminSecret()) {
    // bypass cookie auth for cron with secret
  } else {
    const unauthorized = await requireAdminApi({ allowedRoles: ["admin"] });
    if (unauthorized) return unauthorized;
  }

  const supabase = getSupabaseAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const nextEta = new Date(now.getTime() + 60_000).toISOString();

  // record scheduler heartbeat
  const { data: secretsRow } = await supabase
    .from("platform_secrets")
    .select("id, meta")
    .limit(1)
    .maybeSingle();
  if (secretsRow?.id) {
    const meta = (secretsRow.meta as Record<string, unknown>) ?? {};
    await supabase
      .from("platform_secrets")
      .update({ meta: { ...meta, last_run_at: nowIso, next_run_eta: nextEta } })
      .eq("id", secretsRow.id);
  }

  const { data: duePosts, error } = await supabase
    .from("posts")
    .select("id, caption, media_url, storage_path, media_type, schedule_at, status, enabled")
    .in("status", ["scheduled", "failed"])
    .eq("enabled", true)
    .order("schedule_at", { ascending: true })
    .limit(50);

  if (error) {
    return fail("Failed to query due posts", 500, error.message);
  }

  let processed = 0;

  const refreshResults = await refreshTokensIfNeeded();
  const tokenStatuses = await loadTokenStatuses();
  const tokenStateByPlatform = Object.fromEntries(
    tokenStatuses.map((t) => [t.platform, t.state] as const),
  ) as Record<"tiktok" | "instagram", typeof tokenStatuses[number]["state"]>;

  for (const post of duePosts ?? []) {
    if (post.status === "scheduled" && new Date(post.schedule_at) > now) {
      continue; // not due yet
    }

    if (!post.media_url && !post.storage_path) {
      await supabase
          .from("posts")
          .update({ status: "failed" })
          .eq("id", post.id);
        await logPublishEvent(
          post.id,
          "error",
          "Missing media_url and storage_path",
          undefined,
          { postId: post.id },
        );
        continue;
      }

      await supabase.from("posts").update({ status: "publishing" }).eq("id", post.id);
    await logPublishEvent(post.id, "info", "Publish cycle started");

    const { data: platformRows, error: platformLoadError } = await supabase
      .from("posts_platform")
      .select("id, platform, status, attempts, next_retry_at, lease_expires_at")
      .eq("post_id", post.id);

    if (platformLoadError) {
      await logPublishEvent(post.id, "error", "Unable to load platform rows", undefined, {
        error: platformLoadError.message,
      });
      continue;
    }

    for (const target of platformRows ?? []) {
      if (target.status === "published") continue;
      if (target.lease_expires_at && new Date(target.lease_expires_at) > now) continue;
      if (target.next_retry_at && new Date(target.next_retry_at) > now) continue;

      const attempts = target.attempts ?? 0;
      if (attempts >= DEFAULT_MAX_ATTEMPTS) {
        await supabase
          .from("posts_platform")
          .update({ status: "failed", last_error: "max_attempts_reached" })
          .eq("id", target.id);
        continue;
      }

      const tokenState =
        target.platform === "instagram"
          ? tokenStateByPlatform.instagram
          : tokenStateByPlatform.tiktok;
      if (tokenState === "missing" || tokenState === "expired") {
        await supabase
          .from("posts_platform")
          .update({
            status: "failed",
            last_error: `token_${tokenState}`,
            lease_expires_at: null,
            next_retry_at: null,
          })
          .eq("id", target.id);
        await logPublishEvent(
          post.id,
          "error",
          `${target.platform} token ${tokenState}; cannot publish`,
          target.platform,
        );
        continue;
      }

      await supabase
        .from("posts_platform")
        .update({
          status: "publishing",
          attempts: attempts + 1,
          lease_expires_at: new Date(now.getTime() + LEASE_SECONDS * 1000).toISOString(),
        })
        .eq("id", target.id);

      try {
        const result =
          target.platform === "instagram"
            ? await publishToInstagram({
                postId: post.id,
                platform: "instagram",
                caption: post.caption,
                mediaUrl: post.media_url,
                storagePath: post.storage_path,
                mediaType: post.media_type,
              })
            : await publishToTikTok({
                postId: post.id,
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
            lease_expires_at: null,
            next_retry_at: null,
          })
          .eq("id", target.id);

        await logPublishEvent(post.id, "info", "Platform publish succeeded", target.platform, result);
      } catch (publishError) {
        const message =
          publishError instanceof Error ? publishError.message : "Unknown publish error";

        const isMissingMedia = message.toLowerCase().includes("missing media");
        const backoffSeconds = Math.min(1800, Math.pow(2, attempts) * 60); // up to 30m
        await supabase
          .from("posts_platform")
          .update({
            status: isMissingMedia ? "failed" : "failed",
            last_error: message,
            next_retry_at: isMissingMedia
              ? null
              : new Date(now.getTime() + backoffSeconds * 1000).toISOString(),
            lease_expires_at: null,
          })
          .eq("id", target.id);

        await logPublishEvent(post.id, "error", "Platform publish failed", target.platform, {
          message,
        });
      }
    }

    const { data: finalPlatforms } = await supabase
      .from("posts_platform")
      .select("status")
      .eq("post_id", post.id);

    const finalStatus = statusFromPlatformStatuses(
      (finalPlatforms ?? []).map((item) => item.status),
    );

    await supabase.from("posts").update({ status: finalStatus }).eq("id", post.id);
    processed += 1;
  }

  await logPublishEvent("scheduler", "info", "Scheduler run completed", undefined, {
    processed,
    scanned: duePosts?.length ?? 0,
    refreshResults,
  });

  return ok({ processed, scanned: duePosts?.length ?? 0, lastRunAt: nowIso, nextRunEta: nextEta });
}
