import { fail } from "@/lib/api";
import { getSupabaseRouteClient } from "@/lib/supabase/route";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type RequireOptions = {
  allowedRoles?: string[];
};

export async function requireAdminApi(options?: RequireOptions) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return fail("Unauthorized", 401);
  }

  if (options?.allowedRoles?.length) {
    const { data: profile, error: profileError } = await getSupabaseAdminClient()
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return fail("Failed to load profile", 500, profileError.message);
    }

    const role = profile?.role ?? "user";
    if (!options.allowedRoles.includes(role)) {
      return fail("Forbidden", 403);
    }
  }

  return null;
}

export async function getAuthenticatedUser() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error };
  }

  return { user, error: null };
}
