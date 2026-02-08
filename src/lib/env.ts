function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
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
};
