import { describe, it, expect, vi, afterEach } from "vitest";
import { publishTikTokFromUrl } from "@/lib/tiktok";

vi.mock("@/lib/platforms", () => ({
  loadPlatformSecrets: vi.fn(),
}));

const mockFetch = vi.fn();
const { loadPlatformSecrets } = await import("@/lib/platforms");

vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => mockFetch(input, init));

afterEach(() => {
  mockFetch.mockReset();
});

describe("publishTikTokFromUrl", () => {
  it("throws when token missing", async () => {
    (loadPlatformSecrets as vi.Mock).mockResolvedValue({ tiktok_access_token: null });
    await expect(
      publishTikTokFromUrl({ postId: "1", platform: "tiktok", caption: "", mediaUrl: "https://m.com/v.mp4" }),
    ).rejects.toThrow(/token missing/);
  });

  it("returns postId/share when status completes", async () => {
    (loadPlatformSecrets as vi.Mock).mockResolvedValue({ tiktok_access_token: "tok" });

    // init response
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: { publish_id: "pub-1" } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      // status response
      .mockResolvedValue(
        new Response(
          JSON.stringify({ data: { status: "PUBLISH_COMPLETE", publicaly_available_post_id: ["post-abc"], share_url: "https://tiktok.com/share/post-abc" } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const res = await publishTikTokFromUrl({ postId: "1", platform: "tiktok", caption: "hi", mediaUrl: "https://m.com/v.mp4" });
    expect(res.platformPostId).toBe("post-abc");
    expect(res.platformUrl).toContain("post-abc");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("throws on API error", async () => {
    (loadPlatformSecrets as vi.Mock).mockResolvedValue({ tiktok_access_token: "tok" });
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "bad" } }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      publishTikTokFromUrl({ postId: "1", platform: "tiktok", caption: "", mediaUrl: "https://m.com/v.mp4" }),
    ).rejects.toThrow(/bad/);
  });
});
