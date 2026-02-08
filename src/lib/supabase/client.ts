import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase env vars missing in client: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY");
  }

  return createBrowserClient<Database>(url, key);
}
