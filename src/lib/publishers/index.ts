import { loadPlatformSecrets } from "@/lib/platforms";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getSignedMediaUrl } from "@/lib/storage";
import { assertMediaAvailable } from "@/lib/media";
import { publishTikTokFromUrl, publishTikTokWithUploadFallback } from "@/lib/tiktok";

export type Platform = "instagram" | "tiktok";

export type PublishInput = {
  postId: string;
  platform: Platform;
  caption: string;
  mediaUrl: string | null;
  storagePath?: string | null;
  mediaType?: "image" | "video";
};

async function resolveMediaUrl(input: PublishInput): Promise<string> {
  if (input.mediaUrl) return input.mediaUrl;
  if (input.storagePath) {
    const signed = await getSignedMediaUrl(input.storagePath, 3600);
    if (signed) return signed;
  }
  throw new Error("Missing media URL; ensure media_url or storage_path is populated.");
}

export async function publishToInstagram(input: PublishInput) {
  const secrets = await loadPlatformSecrets();
  if (!secrets.instagram_access_token) {
    throw new Error("Instagram access token missing. Add it in Platform Settings.");
  }
  if (!secrets.instagram_user_id) {
    throw new Error("instagram_user_id missing in platform_secrets.meta");
  }

  await assertMediaAvailable(input.storagePath, input.mediaUrl);
  const mediaUrl = await resolveMediaUrl(input);
  const isVideo = input.mediaType === "video" || mediaUrl.toLowerCase().endsWith(".mp4");

  const createParams = new URLSearchParams({
    caption: input.caption ?? "",
    access_token: secrets.instagram_access_token,
  });
  createParams.append(isVideo ? "video_url" : "image_url", mediaUrl);
  if (isVideo) createParams.append("media_type", "VIDEO");

  const containerRes = await fetch(
    `https://graph.facebook.com/v19.0/${secrets.instagram_user_id}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: createParams.toString(),
    },
  );
  const containerBody = await containerRes.json().catch(() => ({}));
  if (!containerRes.ok || !containerBody.id) {
    throw new Error(containerBody.error?.message ?? "Failed to create Instagram container");
  }

  const containerId = containerBody.id as string;

  if (isVideo) {
    let attempts = 0;
    while (attempts < 8) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const statusRes = await fetch(
        `https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${secrets.instagram_access_token}`,
      );
      const statusBody = await statusRes.json().catch(() => ({}));
      const status = statusBody.status_code as string | undefined;
      if (status === "FINISHED") break;
      if (status === "ERROR") {
        throw new Error("Instagram processing error");
      }
      attempts += 1;
    }
  }

  const publishParams = new URLSearchParams({
    creation_id: containerId,
    access_token: secrets.instagram_access_token,
  });
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${secrets.instagram_user_id}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: publishParams.toString(),
    },
  );
  const publishBody = await publishRes.json().catch(() => ({}));
  if (!publishRes.ok || !publishBody.id) {
    throw new Error(publishBody.error?.message ?? "Failed to publish Instagram media");
  }

  const mediaId = publishBody.id as string;
  const permalinkRes = await fetch(
    `https://graph.facebook.com/v19.0/${mediaId}?fields=permalink&access_token=${secrets.instagram_access_token}`,
  );
  const permalinkBody = await permalinkRes.json().catch(() => ({}));
  const permalink = permalinkBody.permalink as string | undefined;

  return {
    platformPostId: mediaId,
    platformUrl: permalink ?? null,
  };
}

export async function publishToTikTok(input: PublishInput) {
  const secrets = await loadPlatformSecrets();
  if (!secrets.tiktok_access_token) {
    throw new Error("TikTok access token missing. Add it in Platform Settings.");
  }

  await assertMediaAvailable(input.storagePath, input.mediaUrl);
  const mediaUrl = await resolveMediaUrl(input);
  // Primary: pull-from-URL flow, fallback to upload if it fails
  try {
    return await publishTikTokFromUrl({ ...input, mediaUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("pull_from_url") || message.toLowerCase().includes("url")) {
      return await publishTikTokWithUploadFallback({ ...input, mediaUrl });
    }
    throw err;
  }
}

export async function logPublishEvent(
  postId: string,
  level: "info" | "warn" | "error",
  message: string,
  platform?: Platform,
  payload?: unknown,
) {
  const supabase = getSupabaseAdminClient();

  await supabase.from("publish_logs").insert({
    post_id: postId,
    platform: platform ?? null,
    level,
    message,
    payload: payload ?? null,
  });
}
