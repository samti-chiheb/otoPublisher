import { fail, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth/guard";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const tokenFieldByPlatform = {
  tiktok: "tiktok_access_token",
  instagram: "instagram_access_token",
} as const;

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi({ allowedRoles: ["admin"] });
  if (unauthorized) return unauthorized;

  let body: { platform?: "tiktok" | "instagram" };
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }

  if (!body.platform || !(body.platform in tokenFieldByPlatform)) {
    return fail("platform must be instagram or tiktok", 400);
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("platform_secrets")
    .select(`id, ${tokenFieldByPlatform[body.platform]}`)
    .limit(1)
    .maybeSingle();

  if (error) return fail("Failed to load platform secrets", 500, error.message);

  const hasToken =
    body.platform === "tiktok"
      ? Boolean(data && "tiktok_access_token" in data && data.tiktok_access_token)
      : Boolean(
          data &&
            "instagram_access_token" in data &&
            data.instagram_access_token,
        );

  return ok({
    platform: body.platform,
    configured: hasToken,
    message: hasToken ? "Token exists" : "Token missing",
  });
}
