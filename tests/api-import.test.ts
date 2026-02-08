import { describe, it, expect } from "vitest";
import { planSchema } from "@/lib/validation/plan";

const samplePlan = {
  plan_name: "Test",
  timezone: "UTC",
  publications: [
    {
      external_id: "post-1",
      media: { type: "image", url: "https://example.com/img.jpg" },
      caption: "Test",
      schedule_at: "2026-02-10T10:00:00Z",
      targets: ["instagram"],
    },
  ],
};

describe("planSchema", () => {
  it("validates a correct plan", () => {
    const parsed = planSchema.safeParse(samplePlan);
    expect(parsed.success).toBe(true);
  });

  it("fails when targets missing", () => {
    const parsed = planSchema.safeParse({ ...samplePlan, publications: [{ ...samplePlan.publications[0], targets: [] }] });
    expect(parsed.success).toBe(false);
  });
});
