import { getSupabaseAdminClient } from "@/lib/supabase/server";

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
