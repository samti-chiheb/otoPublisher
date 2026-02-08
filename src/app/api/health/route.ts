import { ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth/guard";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("platform_secrets")
    .select("meta")
    .limit(1)
    .maybeSingle();

  const meta = (data?.meta as Record<string, unknown>) ?? {};
  return ok({ lastRunAt: meta["last_run_at"] ?? null, nextRunEta: meta["next_run_eta"] ?? null });
}
