import { describe, expect, it, vi } from "vitest";
import { resolveAiProvider, runModelCampaignCouncil } from "@/lib/ai-provider";
import { runLocalCampaignCouncil } from "@/lib/agent-orchestrator";

const brief = {
  brandName: "Northstar Health",
  productName: "Care Companion",
  challenge: "Help families coordinate daily care without adding administrative work",
  audience: "Caregivers and working families",
  objective: "Create qualified trial intent",
  promise: "Every care decision in one calm place",
  proof: "Encrypted notes · shared reminders · human support during business hours",
  tone: "Calm, precise and reassuring",
  market: "India · English and Hindi",
  channels: ["Instagram", "LinkedIn"],
};

function providerPayload() {
  const payload = { ...runLocalCampaignCouncil(brief) } as Record<string, unknown>;
  delete payload.mode;
  delete payload.provider;
  delete payload.model;
  delete payload.generatedAt;
  return payload;
}

describe("organizer API provider fabric", () => {
  it("automatically prefers the first organizer-listed configured provider", () => {
    const provider = resolveAiProvider({
      OPENROUTER_API_KEY: "openrouter-secret",
      GEMINI_API_KEY: "gemini-secret",
    });
    expect(provider).toMatchObject({ id: "openrouter", model: "openrouter/free" });
  });

  it("honors an explicit provider without silently using another key", () => {
    expect(resolveAiProvider({
      RECAST_AI_PROVIDER: "groq",
      OPENROUTER_API_KEY: "openrouter-secret",
    })).toBeNull();
  });

  it("routes OpenRouter through strict structured output and records provenance", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.model).toBe("openrouter/free");
      expect(body.response_format.json_schema.strict).toBe(true);
      expect(body.provider.require_parameters).toBe(true);
      expect(String(init?.body)).not.toContain("openrouter-secret");
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(providerPayload()) } }] }));
    }) as unknown as typeof fetch;

    const generated = await runModelCampaignCouncil(brief, {
      environment: { OPENROUTER_API_KEY: "openrouter-secret" },
      fetcher,
    });

    expect(generated?.result).toMatchObject({ mode: "ai", provider: "openrouter", model: "openrouter/free" });
    expect(generated?.result.findings).toHaveLength(6);
    expect(fetcher).toHaveBeenCalledWith("https://openrouter.ai/api/v1/chat/completions", expect.any(Object));
  });

  it("uses Gemini's structured Interactions API contract", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.response_format.mime_type).toBe("application/json");
      expect(body.model).toBe("gemini-flash-lite-latest");
      return new Response(JSON.stringify({ output_text: JSON.stringify(providerPayload()) }));
    }) as unknown as typeof fetch;

    const generated = await runModelCampaignCouncil(brief, {
      environment: { RECAST_AI_PROVIDER: "gemini", GEMINI_API_KEY: "gemini-secret" },
      fetcher,
    });

    expect(generated?.result).toMatchObject({ mode: "ai", provider: "gemini", model: "gemini-flash-lite-latest" });
    expect(fetcher).toHaveBeenCalledWith("https://generativelanguage.googleapis.com/v1beta/interactions", expect.any(Object));
  });
});
