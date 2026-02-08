import { describe, it, expect } from "vitest";
import { normalizeScheduleAt } from "@/lib/posts";

const iso = "2026-02-10T10:00:00Z";

describe("normalizeScheduleAt", () => {
  it("passes through ISO string", () => {
    expect(normalizeScheduleAt(iso)).toBe("2026-02-10T10:00:00.000Z");
  });

  it("converts date/time object", () => {
    const res = normalizeScheduleAt({ date: "2026-02-10", time: "10:00" });
    expect(res.startsWith("2026-02-10")).toBeTruthy();
  });
});
