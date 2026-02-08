import { fail, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth/guard";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: RouteParams) {
  const unauthorized = await requireAdminApi({ allowedRoles: ["admin"] });
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("posts")
    .update({ enabled: false, status: "canceled" })
    .eq("id", id);

  if (error) return fail("Failed to disable post", 500, error.message);

  return ok({ disabled: true });
}
