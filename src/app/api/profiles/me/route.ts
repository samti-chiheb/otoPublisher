import { fail, ok } from "@/lib/api";
import { getSupabaseRouteClient } from "@/lib/supabase/route";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

async function getAuthenticatedUser() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return fail("Unauthorized", 401);

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return fail("Failed to load profile", 500, error.message);

  if (!data) {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });
    const isFirstUser = (count ?? 0) === 0;
    const profile = {
      id: user.id,
      username: user.email?.split("@")[0] ?? null,
      display_name: user.email ?? null,
      business_name: null,
      timezone: "UTC",
      notify_on_fail: true,
      avatar_url: null,
      role: isFirstUser ? "admin" : "user",
    };
    const { error: insertError } = await supabase.from("profiles").insert(profile);
    if (insertError) return fail("Failed to create profile", 500, insertError.message);
    return ok({ profile });
  }

  return ok({ profile: data });
}

export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return fail("Unauthorized", 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const displayName = (body.display_name as string | null) ?? null;
  const avatarUrl = (body.avatar_url as string | null) ?? null;
  const username = (body.username as string | null) ?? null;
  const businessName = (body.business_name as string | null) ?? null;
  const timezone = (body.timezone as string | null) ?? null;
  const notifyOnFail = typeof body.notify_on_fail === "boolean" ? body.notify_on_fail : null;
  const requestedRole = typeof body.role === "string" ? body.role : null;

  if (requestedRole && !["admin", "user"].includes(requestedRole)) {
    return fail("Invalid role", 400);
  }

  const supabase = getSupabaseAdminClient();
  const { data: currentProfile, error: loadError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (loadError) return fail("Failed to load profile", 500, loadError.message);

  const nextRole = requestedRole ?? currentProfile?.role ?? "user";

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    username,
    display_name: displayName,
    business_name: businessName,
    timezone,
    notify_on_fail: notifyOnFail,
    avatar_url: avatarUrl,
    role: nextRole,
  });

  if (error) return fail("Failed to save profile", 500, error.message);

  return ok({
    profile: {
      id: user.id,
      username,
      display_name: displayName,
      business_name: businessName,
      timezone,
      notify_on_fail: notifyOnFail,
      avatar_url: avatarUrl,
      role: nextRole,
      created_at: currentProfile?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  });
}
