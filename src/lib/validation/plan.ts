import { z } from "zod";

const targetSchema = z.enum(["instagram", "tiktok"]);

const mediaSchema = z
  .object({
    type: z.enum(["image", "video"]),
    filename: z.string().trim().min(1).optional(),
    url: z.string().url().optional(),
  })
  .refine((value) => Boolean(value.filename || value.url), {
    message: "media.filename or media.url is required",
    path: ["filename"],
  });

const scheduleObjectSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

const publicationSchema = z.object({
  external_id: z.string().trim().min(1).optional(),
  media: mediaSchema,
  caption: z.string(),
  schedule_at: z.union([z.string().datetime({ offset: true }), scheduleObjectSchema]),
  targets: z.array(targetSchema).min(1),
  enabled: z.boolean().default(true),
});

export const planSchema = z.object({
  plan_name: z.string().trim().min(1).optional(),
  timezone: z.string().default("Europe/Paris"),
  publications: z.array(publicationSchema).min(1),
});

export type PlanInput = z.infer<typeof planSchema>;
export type PublicationInput = z.infer<typeof publicationSchema>;
