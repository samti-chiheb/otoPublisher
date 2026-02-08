import { fail, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth/guard";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const unauthorized = await requireAdminApi({ allowedRoles: ["admin"] });
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("platform_secrets")
    .select(
      "id, tiktok_access_token, tiktok_refresh_token, tiktok_expires_at, instagram_access_token, instagram_refresh_token, instagram_expires_at, created_at, updated_at, meta",
    )
    .limit(1)
    .maybeSingle();

  if (error) return fail("Failed to load platform settings", 500, error.message);
  return ok({ settings: data });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi({ allowedRoles: ["admin"] });
  if (unauthorized) return unauthorized;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const allowedFields = [
    "tiktok_access_token",
    "tiktok_refresh_token",
    "tiktok_expires_at",
    "instagram_access_token",
    "instagram_refresh_token",
    "instagram_expires_at",
    "meta",
  ];

  const payload = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key)),
  );

  const supabase = getSupabaseAdminClient();
  const { data: existing } = await supabase
    .from("platform_secrets")
    .select("id")
    .limit(1)
    .maybeSingle();

  const action = existing
    ? supabase.from("platform_secrets").update(payload).eq("id", existing.id)
    : supabase.from("platform_secrets").insert(payload);

  const { error } = await action;
  if (error) return fail("Failed to save platform settings", 500, error.message);

  return ok({ saved: true });
}
