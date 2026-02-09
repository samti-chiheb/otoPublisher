function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string): string | null {
  const value = process.env[name];
  return value ?? null;
}

export const env = {
  adminSecret() {
    return requireEnv("ADMIN_SECRET");
  },
  adminSessionTtlHours() {
    return Number(process.env.ADMIN_SESSION_TTL_HOURS ?? "24");
  },
  supabaseUrl() {
    return requireEnv("SUPABASE_URL");
  },
  supabaseServiceRoleKey() {
    return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  },
  supabaseAnonKey() {
    return requireEnv("SUPABASE_ANON_KEY");
  },
  metaClientSecret() {
    return optionalEnv("META_CLIENT_SECRET");
  },
  tiktokClientKey() {
    return optionalEnv("TIKTOK_CLIENT_KEY");
  },
  tiktokClientSecret() {
    return optionalEnv("TIKTOK_CLIENT_SECRET");
  },
};
