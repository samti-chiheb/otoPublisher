import { loadPlatformSecrets } from "@/lib/platforms";
import { PublishInput } from "@/lib/publishers";

const BASE_URL = "https://open.tiktokapis.com/v2";

function parseTikTokError(json: unknown, status: number) {
  const obj = json as Record<string, unknown> | undefined;
  const msg =
    (obj?.error as Record<string, unknown> | undefined)?.message ||
    (obj?.message as string | undefined) ||
    (obj?.data as Record<string, unknown> | undefined)?.description ||
    `TikTok request failed: ${status}`;
  return new Error(String(msg));
}

async function tiktokFetch(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw parseTikTokError(json, res.status);
  }
  return json;
}

export async function publishTikTokFromUrl(input: PublishInput) {
  const secrets = await loadPlatformSecrets();
  if (!secrets.tiktok_access_token) {
    throw new Error("TikTok access token missing");
  }

  const initBody = {
    post_info: {
      title: input.caption?.slice(0, 150) ?? "",
      privacy_level: "PUBLIC_TO_EVERYONE",
    },
    source_info: {
      source: "PULL_FROM_URL",
      video_url: input.mediaUrl,
    },
    post_mode: "DIRECT_POST",
    media_type: "VIDEO",
  };

  const initJson = await tiktokFetch("/post/publish/content/init/", secrets.tiktok_access_token, {
    method: "POST",
    body: JSON.stringify(initBody),
  });

  const publishId = initJson?.data?.publish_id as string | undefined;
  if (!publishId) throw new Error("TikTok did not return publish_id");

  return pollTikTokStatus(publishId, secrets.tiktok_access_token);
}

export async function publishTikTokWithUploadFallback(input: PublishInput) {
  const secrets = await loadPlatformSecrets();
  if (!secrets.tiktok_access_token) {
    throw new Error("TikTok access token missing");
  }

  // Step 1: init upload to get upload_url + upload_id
  const initUpload = await tiktokFetch(
    "/post/publish/video/init/",
    secrets.tiktok_access_token,
    {
      method: "POST",
      body: JSON.stringify({
        source_info: { source: "PULL_FROM_URL", video_url: input.mediaUrl },
      }),
    },
  );
  const uploadUrl = initUpload?.data?.upload_url as string | undefined;
  const uploadId = initUpload?.data?.upload_id as string | undefined;
  if (!uploadUrl || !uploadId) {
    throw new Error(initUpload?.error?.message ?? initUpload?.message ?? "TikTok upload init failed");
  }

  // Step 2: upload video bytes
  const mediaBuffer = await fetch(input.mediaUrl as string).then((r) => r.arrayBuffer());
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: mediaBuffer,
  });
  if (!uploadRes.ok) {
    throw new Error("TikTok upload failed: PUT to upload_url");
  }

  // Step 3: create post referencing upload_id
  const initJson = await tiktokFetch("/post/publish/content/init/", secrets.tiktok_access_token, {
    method: "POST",
    body: JSON.stringify({
      post_info: { title: input.caption?.slice(0, 150) ?? "", privacy_level: "PUBLIC_TO_EVERYONE" },
      source_info: { source: "UPLOAD", upload_id: uploadId },
      post_mode: "DIRECT_POST",
      media_type: "VIDEO",
    }),
  });

  const publishId = initJson?.data?.publish_id as string | undefined;
  if (!publishId) throw new Error("TikTok did not return publish_id");

  return pollTikTokStatus(publishId, secrets.tiktok_access_token);
}

async function pollTikTokStatus(publishId: string, token: string) {
  let postId: string | undefined;
  let shareUrl: string | undefined;
  let lastStatus: string | undefined;
  for (let i = 0; i < 15; i += 1) {
    await new Promise((r) => setTimeout(r, 1500));
    const statusJson = await tiktokFetch(
      `/post/publish/status/?publish_id=${publishId}`,
      token,
      { method: "GET" },
    );
    const status = statusJson?.data?.status as string | undefined;
    lastStatus = status;
    postId = statusJson?.data?.publicaly_available_post_id?.[0];
    shareUrl = statusJson?.data?.share_url as string | undefined;
    if (status === "PUBLISH_COMPLETE") break;
    if (status === "FAILED") {
      throw parseTikTokError(statusJson, 400);
    }
  }

  if (lastStatus !== "PUBLISH_COMPLETE") {
    throw new Error(`TikTok publish pending or timeout (last status: ${lastStatus ?? "unknown"})`);
  }

  return {
    platformPostId: postId ?? publishId,
    platformUrl: shareUrl ?? (postId ? `https://www.tiktok.com/@/video/${postId}` : null),
  };
}
