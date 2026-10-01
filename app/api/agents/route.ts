import { NextResponse } from "next/server";
import {
  AgentBriefSchema,
  runLocalCampaignCouncil,
} from "@/lib/agent-orchestrator";
import { resolveAiProvider, runModelCampaignCouncil } from "@/lib/ai-provider";
import { consumeAgentQuota } from "@/lib/agent-access";

export const runtime = "nodejs";

const requestBuckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 8;
const MAX_BODY_BYTES = 16_384;
const MAX_INSTANCE_BUCKETS = 10_000;
const TARGET_INSTANCE_BUCKETS = 8_000;

function clientKey(request: Request): string {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

function rateLimited(request: Request): boolean {
  const now = Date.now();
  const key = clientKey(request);
  if (requestBuckets.size > MAX_INSTANCE_BUCKETS) {
    for (const [candidateKey, bucket] of requestBuckets) {
      if (bucket.resetAt <= now) requestBuckets.delete(candidateKey);
      if (requestBuckets.size <= TARGET_INSTANCE_BUCKETS) break;
    }
    // This map is only a cheap instance-local shield; evicting old insertion
    // order is safer than allowing spoofed client keys to exhaust memory. The
    // authenticated Postgres quota remains the authoritative provider gate.
    if (requestBuckets.size > MAX_INSTANCE_BUCKETS) {
      for (const candidateKey of requestBuckets.keys()) {
        requestBuckets.delete(candidateKey);
        if (requestBuckets.size <= TARGET_INSTANCE_BUCKETS) break;
      }
    }
  }
  const current = requestBuckets.get(key);
  if (!current || current.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS;
}

function requestId(): string {
  return crypto.randomUUID();
}

function logAgentRun(fields: Record<string, unknown>) {
  console.log(JSON.stringify({ level: "info", event: "agent_run", route: "/api/agents", ...fields }));
}

function fallbackResponse(
  body: ReturnType<typeof runLocalCampaignCouncil>,
  reason: string,
  id: string,
) {
  return NextResponse.json(body, { headers: {
    "Cache-Control": "no-store",
    "X-Request-ID": id,
    "X-RECAST-Agent-Mode": "local-fallback",
    "X-RECAST-Fallback-Reason": reason,
    "X-RECAST-Agent-Provider": "local",
  } });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const id = requestId();
  if (rateLimited(request)) {
    logAgentRun({ requestId: id, outcome: "instance_limited", status: 429, durationMs: Date.now() - startedAt });
    return NextResponse.json({ error: "Too many agent runs. Try again in a minute." }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60", "X-Request-ID": id } });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    logAgentRun({ requestId: id, outcome: "body_too_large", status: 413, durationMs: Date.now() - startedAt });
    return NextResponse.json({ error: "The campaign brief is too large." }, { status: 413, headers: { "Cache-Control": "no-store", "X-Request-ID": id } });
  }

  const body = await request.text().catch(() => "");
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    logAgentRun({ requestId: id, outcome: "body_too_large", status: 413, durationMs: Date.now() - startedAt });
    return NextResponse.json({ error: "The campaign brief is too large." }, { status: 413, headers: { "Cache-Control": "no-store", "X-Request-ID": id } });
  }

  let candidate: unknown = null;
  try { candidate = JSON.parse(body); } catch { candidate = null; }
  const parsed = AgentBriefSchema.safeParse(candidate);
  if (!parsed.success) {
    logAgentRun({ requestId: id, outcome: "invalid_brief", status: 400, durationMs: Date.now() - startedAt });
    return NextResponse.json({ error: "The campaign brief is incomplete or invalid." }, { status: 400, headers: { "Cache-Control": "no-store", "X-Request-ID": id } });
  }

  const fallback = runLocalCampaignCouncil(parsed.data);
  const configuredProvider = resolveAiProvider();
  if (!configuredProvider) {
    logAgentRun({ requestId: id, outcome: "local_provider_unconfigured", status: 200, durationMs: Date.now() - startedAt });
    return fallbackResponse(fallback, "provider-unconfigured", id);
  }

  const access = await consumeAgentQuota(request);
  if (access.status === "unauthenticated") {
    logAgentRun({ requestId: id, outcome: "local_authentication_required", status: 200, durationMs: Date.now() - startedAt });
    return fallbackResponse(fallback, "authentication-required", id);
  }
  if (access.status === "unavailable") {
    logAgentRun({ requestId: id, outcome: "local_quota_unavailable", status: 200, durationMs: Date.now() - startedAt });
    return fallbackResponse(fallback, "quota-unavailable", id);
  }
  if (access.status === "limited") {
    const retryAfter = Math.max(1, Math.ceil((Date.parse(access.resetAt) - Date.now()) / 1000));
    logAgentRun({ requestId: id, outcome: "durable_quota_limited", status: 429, durationMs: Date.now() - startedAt });
    return NextResponse.json({ error: "Your AI council quota is renewing shortly." }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(retryAfter), "X-Request-ID": id } });
  }
  if (access.status !== "allowed") {
    logAgentRun({ requestId: id, outcome: "local_access_unavailable", status: 200, durationMs: Date.now() - startedAt });
    return fallbackResponse(fallback, "quota-unavailable", id);
  }

  try {
    const generated = await runModelCampaignCouncil(parsed.data);
    if (!generated) return fallbackResponse(fallback, "provider-unconfigured", id);
    logAgentRun({ requestId: id, outcome: "ai_success", status: 200, provider: generated.provider.id, quotaRemaining: access.remaining, durationMs: Date.now() - startedAt });
    return NextResponse.json(generated.result, { headers: {
      "Cache-Control": "no-store",
      "X-Request-ID": id,
      "X-RECAST-Agent-Mode": "ai",
      "X-RECAST-Agent-Provider": generated.provider.id,
    } });
  } catch (error) {
    logAgentRun({ requestId: id, outcome: "local_provider_unavailable", status: 200, errorType: error instanceof Error ? error.name : "UnknownError", durationMs: Date.now() - startedAt });
    return fallbackResponse(fallback, "provider-unavailable", id);
  }
}
