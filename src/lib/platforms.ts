import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

const META_REFRESH_TTL_DAYS = 55; // refresh long-lived tokens ~55 days (IG) before expiry

export type PlatformSecrets = {
  tiktok_access_token: string | null;
  instagram_access_token: string | null;
  tiktok_refresh_token?: string | null;
  instagram_refresh_token?: string | null;
  tiktok_expires_at?: string | null;
  instagram_expires_at?: string | null;
  instagram_user_id?: string | null;
  tiktok_user_id?: string | null;
};

export type TokenStatus =
  | { platform: "tiktok" | "instagram"; state: "missing"; expiresAt: string | null; daysLeft: null }
  | { platform: "tiktok" | "instagram"; state: "expired"; expiresAt: string | null; daysLeft: number }
  | { platform: "tiktok" | "instagram"; state: "warning" | "ok"; expiresAt: string | null; daysLeft: number | null };

export async function loadPlatformSecrets(): Promise<PlatformSecrets> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("platform_secrets")
    .select("*, meta")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load platform secrets: ${error.message}`);
  }

  const meta = (data?.meta as Record<string, unknown>) ?? {};

  return {
    tiktok_access_token: data?.tiktok_access_token ?? null,
    instagram_access_token: data?.instagram_access_token ?? null,
    tiktok_refresh_token: data?.tiktok_refresh_token ?? null,
    instagram_refresh_token: data?.instagram_refresh_token ?? null,
    tiktok_expires_at: data?.tiktok_expires_at ?? null,
    instagram_expires_at: data?.instagram_expires_at ?? null,
    instagram_user_id: (meta["instagram_user_id"] as string) ?? null,
    tiktok_user_id: (meta["tiktok_user_id"] as string) ?? null,
  };
}

function computeTokenStatus(platform: "tiktok" | "instagram", token: string | null | undefined, expiresAt?: string | null): TokenStatus {
  if (!token) return { platform, state: "missing", expiresAt: expiresAt ?? null, daysLeft: null };
  if (!expiresAt) return { platform, state: "ok", expiresAt: null, daysLeft: null };
  const diff = new Date(expiresAt).getTime() - Date.now();
  const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (diff <= 0) return { platform, state: "expired", expiresAt, daysLeft };
  if (daysLeft <= 10) return { platform, state: "warning", expiresAt, daysLeft };
  return { platform, state: "ok", expiresAt, daysLeft };
}

export async function loadTokenStatuses(): Promise<TokenStatus[]> {
  const secrets = await loadPlatformSecrets();
  return [
    computeTokenStatus("tiktok", secrets.tiktok_access_token, secrets.tiktok_expires_at),
    computeTokenStatus("instagram", secrets.instagram_access_token, secrets.instagram_expires_at),
  ];
}

export async function updatePlatformMeta(meta: Record<string, unknown>) {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase.from("platform_secrets").select("id, meta").limit(1).maybeSingle();
  if (!data?.id) return;
  const merged = { ...(data.meta as Record<string, unknown> | null | undefined), ...meta };
  await supabase.from("platform_secrets").update({ meta: merged }).eq("id", data.id);
}

type RefreshResult = { platform: "instagram" | "tiktok"; refreshed: boolean; message?: string };

export async function refreshTokensIfNeeded(): Promise<RefreshResult[]> {
  const supabase = getSupabaseAdminClient();
  const secrets = await loadPlatformSecrets();
  const results: RefreshResult[] = [];

  // Instagram: if expires_at within TTL, attempt refresh if refresh_token present
  if (secrets.instagram_refresh_token) {
    const status = computeTokenStatus("instagram", secrets.instagram_access_token, secrets.instagram_expires_at);
    if (status.state === "warning" || status.state === "expired") {
      const metaSecret = env.metaClientSecret();
      if (!metaSecret) {
        results.push({ platform: "instagram", refreshed: false, message: "META_CLIENT_SECRET missing" });
      } else {
        try {
          const refresh = await fetch(
          `https://graph.facebook.com/v19.0/refresh_access_token?grant_type=fb_exchange_token&client_secret=${metaSecret}&fb_exchange_token=${secrets.instagram_refresh_token}`,
          { method: "GET" },
        );
          const json = await refresh.json().catch(() => ({}));
        if (!refresh.ok || !json.access_token) {
          throw new Error(json.error?.message ?? "IG refresh failed");
        }
        const expiresIn = json.expires_in ? Number(json.expires_in) : 60 * 24 * 60 * 60;
        const newExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();
        await supabase.from("platform_secrets").update({
          instagram_access_token: json.access_token,
          instagram_expires_at: newExpiry,
        });
        results.push({ platform: "instagram", refreshed: true });
      } catch (err) {
        results.push({
          platform: "instagram",
          refreshed: false,
          message: err instanceof Error ? err.message : String(err),
        });
      }
      }
    }
  }

  // TikTok: if expires_at within TTL, attempt refresh if refresh_token present
  if (secrets.tiktok_refresh_token) {
    const status = computeTokenStatus("tiktok", secrets.tiktok_access_token, secrets.tiktok_expires_at);
    if (status.state === "warning" || status.state === "expired") {
      const tiktokKey = env.tiktokClientKey();
      const tiktokSecret = env.tiktokClientSecret();
      if (!tiktokKey || !tiktokSecret) {
        results.push({
          platform: "tiktok",
          refreshed: false,
          message: "TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_SECRET missing",
        });
      } else {
        try {
          const refresh = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
            client_key: tiktokKey,
            client_secret: tiktokSecret,
            grant_type: "refresh_token",
            refresh_token: secrets.tiktok_refresh_token,
          }).toString(),
        });
        const json = await refresh.json().catch(() => ({}));
        if (!refresh.ok || !json.access_token) {
          throw new Error(json.error?.message ?? "TikTok refresh failed");
        }
        const expiresIn = json.expires_in ? Number(json.expires_in) : META_REFRESH_TTL_DAYS * 24 * 60 * 60;
        const newExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();
        await supabase.from("platform_secrets").update({
          tiktok_access_token: json.access_token,
          tiktok_refresh_token: json.refresh_token ?? secrets.tiktok_refresh_token,
          tiktok_expires_at: newExpiry,
        });
        results.push({ platform: "tiktok", refreshed: true });
      } catch (err) {
        results.push({
          platform: "tiktok",
          refreshed: false,
          message: err instanceof Error ? err.message : String(err),
        });
      }
      }
    }
  }

  return results;
}
