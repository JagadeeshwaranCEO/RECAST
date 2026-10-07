import { describe, expect, it, vi } from "vitest";
import { checkSupabaseHealth } from "@/lib/supabase/health";

const environment = {
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};

describe("Supabase production health probe", () => {
  it("reports an optional integration when configuration is absent", async () => {
    const fetcher = vi.fn();
    await expect(checkSupabaseHealth({ environment: {}, fetcher })).resolves.toBe("not-configured");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("performs a minimal uncached read with the publishable key", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      void init;
      return new Response("[]", { status: 200 });
    });
    await expect(checkSupabaseHealth({ environment, fetcher: fetcher as unknown as typeof fetch })).resolves.toBe("ready");
    expect(fetcher).toHaveBeenCalledOnce();
    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).toBe("https://project.supabase.co/rest/v1/campaign_publications?select=id&limit=1");
    expect(init).toMatchObject({ cache: "no-store", headers: { apikey: "sb_publishable_test" } });
  });

  it("fails closed when Supabase cannot be reached", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      void init;
      return new Response("unavailable", { status: 503 });
    });
    await expect(checkSupabaseHealth({ environment, fetcher: fetcher as unknown as typeof fetch })).resolves.toBe("degraded");
  });
});
