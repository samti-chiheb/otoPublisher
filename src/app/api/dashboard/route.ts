import { fail, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth/guard";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

async function countByStatus(status: string) {
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", status);
  if (error) throw error;
  return count ?? 0;
}

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseAdminClient();

  try {
    const [scheduled, publishing, failed, published] = await Promise.all([
      countByStatus("scheduled"),
      countByStatus("publishing"),
      countByStatus("failed"),
      countByStatus("published"),
    ]);

    const { data: upcoming } = await supabase
      .from("posts")
      .select("id, caption, schedule_at, posts_platform(platform)")
      .eq("status", "scheduled")
      .eq("enabled", true)
      .gte("schedule_at", new Date().toISOString())
      .order("schedule_at", { ascending: true })
      .limit(5);

    const { data: logs } = await supabase
      .from("publish_logs")
      .select("id, level, message, platform, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: lastLog } = await supabase
      .from("publish_logs")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: secrets } = await supabase
      .from("platform_secrets")
      .select(
        "tiktok_access_token, instagram_access_token, tiktok_expires_at, instagram_expires_at, updated_at, meta",
      )
      .limit(1)
      .maybeSingle();
    const meta = (secrets?.meta as Record<string, unknown>) ?? {};

    return ok({
      stats: { scheduled, publishing, failed, published },
      upcoming: upcoming ?? [],
      logs: logs ?? [],
      health: {
        lastRunAt: (meta["last_run_at"] as string) ?? lastLog?.created_at ?? null,
        nextRunEta: (meta["next_run_eta"] as string) ?? null,
        tokens: {
          tiktok: Boolean(secrets?.tiktok_access_token),
          instagram: Boolean(secrets?.instagram_access_token),
        },
        tokensUpdatedAt: secrets?.updated_at ?? null,
        tiktokExpiresAt: secrets?.tiktok_expires_at ?? null,
        instagramExpiresAt: secrets?.instagram_expires_at ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fail("Failed to load dashboard", 500, message);
  }
}
