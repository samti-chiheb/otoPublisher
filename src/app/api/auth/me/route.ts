import { ok } from "@/lib/api";
import { hasAdminSession } from "@/lib/auth/session";

export async function GET() {
  const authenticated = await hasAdminSession();
  return ok({ authenticated });
}
