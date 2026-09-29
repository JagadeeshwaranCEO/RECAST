import { NextResponse } from "next/server";
import {
  AgentBriefSchema,
  AgentCouncilResultSchema,
  agentSystemPrompt,
  runLocalCampaignCouncil,
} from "@/lib/agent-orchestrator";

export const runtime = "edge";

const requestBuckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 8;

function clientKey(request: Request): string {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

function rateLimited(request: Request): boolean {
  const now = Date.now();
  const key = clientKey(request);
  const current = requestBuckets.get(key);
  if (!current || current.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS;
}

function extractResponseText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { output_text?: unknown; output?: unknown };
  if (typeof record.output_text === "string") return record.output_text;
  if (!Array.isArray(record.output)) return null;
  for (const item of record.output) {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (content && typeof content === "object" && "text" in content && typeof content.text === "string") return content.text;
    }
  }
  return null;
}

export async function POST(request: Request) {
  if (rateLimited(request)) return NextResponse.json({ error: "Too many agent runs. Try again in a minute." }, { status: 429 });

  const parsed = AgentBriefSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The campaign brief is incomplete or invalid." }, { status: 400 });

  const fallback = runLocalCampaignCouncil(parsed.data);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json(fallback, { headers: { "Cache-Control": "no-store" } });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
        input: agentSystemPrompt(parsed.data),
        text: { format: { type: "json_schema", name: "campaign_council", strict: true, schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            mode: { type: "string", enum: ["ai"] },
            campaignThesis: { type: "string" },
            generatedAt: { type: "string" },
            findings: { type: "array", minItems: 4, maxItems: 8, items: { type: "object", additionalProperties: false, properties: {
              id: { type: "string" }, agent: { type: "string" }, role: { type: "string" }, title: { type: "string" }, summary: { type: "string" }, outputs: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
            }, required: ["id", "agent", "role", "title", "summary", "outputs"] } },
            channelPlan: { type: "array", minItems: 1, maxItems: 8, items: { type: "object", additionalProperties: false, properties: {
              channel: { type: "string" }, job: { type: "string" }, format: { type: "string" },
            }, required: ["channel", "job", "format"] } },
          },
          required: ["mode", "campaignThesis", "findings", "channelPlan", "generatedAt"],
        } } },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return NextResponse.json(fallback, { headers: { "Cache-Control": "no-store", "X-RECAST-Agent-Mode": "local-fallback" } });
    const responseText = extractResponseText(await response.json());
    const generated = responseText ? AgentCouncilResultSchema.safeParse(JSON.parse(responseText)) : null;
    if (!generated?.success) return NextResponse.json(fallback, { headers: { "Cache-Control": "no-store", "X-RECAST-Agent-Mode": "local-fallback" } });
    return NextResponse.json(generated.data, { headers: { "Cache-Control": "no-store", "X-RECAST-Agent-Mode": "ai" } });
  } catch {
    return NextResponse.json(fallback, { headers: { "Cache-Control": "no-store", "X-RECAST-Agent-Mode": "local-fallback" } });
  }
}
