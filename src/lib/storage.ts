import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function getSignedMediaUrl(storagePath: string, expiresInSeconds = 3600) {
  const supabase = getSupabaseAdminClient();

  const [bucket, ...keyParts] = storagePath.split("/");
  if (!bucket || keyParts.length === 0) return null;
  const path = keyParts.join("/");

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function objectExists(storagePath: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const [bucket, ...keyParts] = storagePath.split("/");
  if (!bucket || keyParts.length === 0) return false;
  const path = keyParts.join("/");
  const parts = path.split("/");
  const fileName = parts.pop() || "";
  const folder = parts.join("/");

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, { search: fileName, limit: 1 });
  if (error) return false;
  return (data ?? []).some((obj) => obj.name === fileName);
}
