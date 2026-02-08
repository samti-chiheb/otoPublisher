import { objectExists } from "@/lib/storage";

export async function assertMediaAvailable(storagePath?: string | null, mediaUrl?: string | null) {
  if (mediaUrl) return;
  if (storagePath) {
    const exists = await objectExists(storagePath);
    if (!exists) {
      throw new Error(`Missing media in storage: ${storagePath}`);
    }
    return;
  }
  throw new Error("Missing media URL or storage path");
}
