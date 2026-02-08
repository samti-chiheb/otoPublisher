import { describe, it, expect } from "vitest";
import { isAdminSecretValid } from "@/lib/auth/session";

const SECRET = "super-secret";
process.env.ADMIN_SECRET = SECRET;

describe("isAdminSecretValid", () => {
  it("accepts correct secret", () => {
    expect(isAdminSecretValid(SECRET)).toBe(true);
  });

  it("rejects wrong secret", () => {
    expect(isAdminSecretValid("wrong")).toBe(false);
  });
});
