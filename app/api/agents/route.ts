import { NextResponse } from "next/server";
import {
  AgentBriefSchema,
  runLocalCampaignCouncil,
} from "@/lib/agent-orchestrator";
import { runModelCampaignCouncil } from "@/lib/ai-provider";

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

export async function POST(request: Request) {
  if (rateLimited(request)) return NextResponse.json({ error: "Too many agent runs. Try again in a minute." }, { status: 429 });

  const parsed = AgentBriefSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The campaign brief is incomplete or invalid." }, { status: 400 });

  const fallback = runLocalCampaignCouncil(parsed.data);
  try {
    const generated = await runModelCampaignCouncil(parsed.data);
    if (!generated) return NextResponse.json(fallback, { headers: {
      "Cache-Control": "no-store",
      "X-RECAST-Agent-Mode": "local-fallback",
      "X-RECAST-Fallback-Reason": "provider-unconfigured",
      "X-RECAST-Agent-Provider": "local",
    } });
    return NextResponse.json(generated.result, { headers: {
      "Cache-Control": "no-store",
      "X-RECAST-Agent-Mode": "ai",
      "X-RECAST-Agent-Provider": generated.provider.id,
    } });
  } catch {
    return NextResponse.json(fallback, { headers: {
      "Cache-Control": "no-store",
      "X-RECAST-Agent-Mode": "local-fallback",
      "X-RECAST-Fallback-Reason": "provider-unavailable",
      "X-RECAST-Agent-Provider": "local",
    } });
  }
}
