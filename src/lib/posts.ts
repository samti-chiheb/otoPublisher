import type { PublicationInput } from "@/lib/validation/plan";

export const PLATFORM_VALUES = ["instagram", "tiktok"] as const;
export type Platform = (typeof PLATFORM_VALUES)[number];

export function normalizeScheduleAt(
  scheduleAt: PublicationInput["schedule_at"],
): string {
  if (typeof scheduleAt === "string") {
    const iso = new Date(scheduleAt).toISOString();
    return iso;
  }

  return new Date(`${scheduleAt.date}T${scheduleAt.time}:00`).toISOString();
}

export function statusFromPlatformStatuses(statuses: string[]):
  | "scheduled"
  | "publishing"
  | "published"
  | "failed" {
  if (statuses.length === 0) return "scheduled";
  if (statuses.every((status) => status === "published")) return "published";
  if (statuses.some((status) => status === "publishing")) return "publishing";
  if (statuses.some((status) => status === "failed")) return "failed";
  return "scheduled";
}
