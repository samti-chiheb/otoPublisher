import { fail, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth/guard";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: RouteParams) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*, posts_platform(*), publish_logs(*)")
    .eq("id", id)
    .single();

  if (error) return fail("Post not found", 404, error.message);
  return ok({ post: data });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const allowedFields = [
    "caption",
    "schedule_at",
    "enabled",
    "status",
    "media_filename",
    "media_url",
    "storage_path",
  ];

  const updates = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key)),
  );

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return fail("Failed to update post", 400, error.message);
  return ok({ post: data });
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) return fail("Failed to delete post", 400, error.message);

  return ok({ deleted: true });
}
