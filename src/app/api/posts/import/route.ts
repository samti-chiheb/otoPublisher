import { fail, ok } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth/guard";
import { normalizeScheduleAt } from "@/lib/posts";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { objectExists } from "@/lib/storage";
import { planSchema } from "@/lib/validation/plan";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const parsed = planSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation failed", 422, parsed.error.flatten());
  }

  const missingMedia: Array<{ filename: string; external_id?: string }> = [];

  // Pre-validate media existence for filename-based items
  for (const publication of parsed.data.publications) {
    if (publication.media.filename) {
      const storagePath = `media/${publication.media.filename}`;
      const exists = await objectExists(storagePath);
      if (!exists) {
        missingMedia.push({
          filename: publication.media.filename,
          external_id: publication.external_id ?? undefined,
        });
      }
    }
  }

  if (missingMedia.length > 0) {
    return fail("Missing media files", 422, { missingMedia });
  }

  const supabase = getSupabaseAdminClient();
  let created = 0;
  let updated = 0;

  for (const publication of parsed.data.publications) {
    const payload = {
      external_id: publication.external_id ?? null,
      caption: publication.caption,
      schedule_at: normalizeScheduleAt(publication.schedule_at),
      enabled: publication.enabled,
      status: "scheduled",
      media_type: publication.media.type,
      media_filename: publication.media.filename ?? null,
      media_url: publication.media.url ?? null,
      storage_path: publication.media.filename
        ? `media/${publication.media.filename}`
        : null,
    };

    let postId: string | null = null;

    if (publication.external_id) {
      const { data, error } = await supabase
        .from("posts")
        .upsert(payload, { onConflict: "external_id" })
        .select("id")
        .single();

      if (error) {
        return fail("Failed to upsert post", 500, error.message);
      }

      postId = data.id;
      updated += 1;
    } else {
      const { data, error } = await supabase
        .from("posts")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        return fail("Failed to create post", 500, error.message);
      }

      postId = data.id;
      created += 1;
    }

    const platformRows = publication.targets.map((platform) => ({
      post_id: postId,
      platform,
      status: "scheduled",
      attempts: 0,
      last_error: null,
      platform_post_id: null,
      platform_url: null,
      published_at: null,
      next_retry_at: null,
      lease_expires_at: null,
    }));

    const { error: platformError } = await supabase
      .from("posts_platform")
      .upsert(platformRows, { onConflict: "post_id,platform" });

    if (platformError) {
      return fail("Failed to sync platform targets", 500, platformError.message);
    }
  }

  return ok({ created, updated, total: parsed.data.publications.length });
}
