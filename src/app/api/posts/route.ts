import { fail, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth/guard";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const platform = searchParams.get("platform");
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");
  const limit = Number(searchParams.get("limit") ?? 100);

  const supabase = getSupabaseAdminClient();

  let query = supabase
    .from("posts")
    .select(
      platform ? "*, posts_platform!inner(*)" : "*, posts_platform(*)",
    )
    .order("schedule_at", { ascending: true })
    .limit(Math.min(Math.max(limit, 1), 500));

  if (status) {
    query = query.eq("status", status);
  }

  if (dateFrom) {
    query = query.gte("schedule_at", dateFrom);
  }

  if (dateTo) {
    query = query.lte("schedule_at", dateTo);
  }

  if (platform) {
    query = query.eq("posts_platform.platform", platform);
  }

  const { data, error } = await query;

  if (error) {
    return fail("Failed to load posts", 500, error.message);
  }

  return ok({ posts: data ?? [] });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      caption: body.caption,
      schedule_at: body.schedule_at,
      enabled: body.enabled ?? true,
      status: "scheduled",
      media_type: body.media_type,
      media_filename: body.media_filename,
      media_url: body.media_url,
      storage_path: body.storage_path,
      external_id: body.external_id,
    })
    .select("*")
    .single();

  if (error) {
    return fail("Failed to create post", 400, error.message);
  }

  return ok({ post: data }, { status: 201 });
}
