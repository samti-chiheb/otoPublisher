import { ok } from "@/lib/api";
import { clearAdminSessionCookie } from "@/lib/auth/session";

export async function POST() {
  await clearAdminSessionCookie();
  return ok({ authenticated: false });
}
