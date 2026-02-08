import { fail, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth/guard";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: RouteParams) {
  const unauthorized = await requireAdminApi({ allowedRoles: ["admin"] });
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  const { error: platformError } = await supabase
    .from("posts_platform")
    .update({ status: "scheduled", attempts: 0, last_error: null })
    .eq("post_id", id);

  if (platformError) return fail("Failed to reset platform rows", 500, platformError.message);

  const { error: postError } = await supabase
    .from("posts")
    .update({ status: "scheduled", enabled: true })
    .eq("id", id);

  if (postError) return fail("Failed to update post", 500, postError.message);

  return ok({ reset: true });
}
