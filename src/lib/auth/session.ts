import { cookies } from "next/headers";

import { ADMIN_COOKIE_NAME } from "@/lib/auth/constants";
import { env } from "@/lib/env";

export function isAdminSecretValid(secret: string): boolean {
  return secret.trim().length > 0 && secret === env.adminSecret();
}

export async function setAdminSessionCookie() {
  const cookieStore = await cookies();
  const maxAge = env.adminSessionTtlHours() * 60 * 60;

  cookieStore.set(ADMIN_COOKIE_NAME, "ok", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function hasAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return value === "ok";
}

export const adminCookieName = ADMIN_COOKIE_NAME;
