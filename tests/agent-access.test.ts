import { describe, expect, it, vi } from "vitest";
import { consumeAgentQuota } from "@/lib/agent-access";

const environment = {
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};

describe("agent provider access boundary", () => {
  it("does not contact the quota service without a bearer session", async () => {
    const fetcher = vi.fn();
    const decision = await consumeAgentQuota(new Request("https://recast.test/api/agents"), { environment, fetcher });
    expect(decision).toEqual({ status: "unauthenticated" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("accepts only a database-authorized quota result", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify([{ allowed: true, remaining: 7, reset_at: "2026-10-01T03:00:00.000Z" }]), { status: 200 })) as unknown as typeof fetch;
    const request = new Request("https://recast.test/api/agents", { headers: { Authorization: "Bearer signed.session.token" } });
    await expect(consumeAgentQuota(request, { environment, fetcher })).resolves.toEqual({ status: "allowed", remaining: 7, resetAt: "2026-10-01T03:00:00.000Z" });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("fails closed when the quota service is unavailable", async () => {
    const fetcher = vi.fn(async () => new Response("unavailable", { status: 503 })) as unknown as typeof fetch;
    const request = new Request("https://recast.test/api/agents", { headers: { Authorization: "Bearer signed.session.token" } });
    await expect(consumeAgentQuota(request, { environment, fetcher })).resolves.toEqual({ status: "unavailable" });
  });
});
