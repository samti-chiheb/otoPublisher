import { fail, ok } from "@/lib/api";
import { isAdminSecretValid, setAdminSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  let body: { secret?: string };

  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }

  if (!body.secret || !isAdminSecretValid(body.secret)) {
    return fail("Invalid admin secret", 401);
  }

  await setAdminSessionCookie();
  return ok({ authenticated: true });
}
