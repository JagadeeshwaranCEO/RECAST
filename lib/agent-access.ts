import { z } from "zod";

type AgentAccessEnvironment = Record<string, string | undefined>;
type Fetcher = typeof fetch;

export type AgentAccessDecision =
  | { status: "allowed"; remaining: number; resetAt: string }
  | { status: "limited"; remaining: 0; resetAt: string }
  | { status: "unauthenticated" | "unavailable" };

const QuotaResultSchema = z.object({
  allowed: z.boolean(),
  remaining: z.number().int().min(0).max(8),
  reset_at: z.string().datetime({ offset: true }),
}).strict();

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer ([A-Za-z0-9._~-]+)$/.exec(authorization);
  if (!match || match[1].length > 4096) return null;
  return match[1];
}

export async function consumeAgentQuota(
  request: Request,
  options: { environment?: AgentAccessEnvironment; fetcher?: Fetcher } = {},
): Promise<AgentAccessDecision> {
  const token = bearerToken(request);
  if (!token) return { status: "unauthenticated" };

  const environment = options.environment ?? process.env;
  const supabaseUrl = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!supabaseUrl || !publishableKey) return { status: "unavailable" };

  let endpoint: URL;
  try {
    endpoint = new URL("/rest/v1/rpc/recast_consume_agent_quota", supabaseUrl);
  } catch {
    return { status: "unavailable" };
  }

  try {
    const response = await (options.fetcher ?? fetch)(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        apikey: publishableKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: "{}",
      signal: AbortSignal.timeout(5_000),
    });

    if (response.status === 401 || response.status === 403) return { status: "unauthenticated" };
    if (!response.ok) return { status: "unavailable" };

    const payload = await response.json() as unknown;
    const row = Array.isArray(payload) ? payload[0] : payload;
    const parsed = QuotaResultSchema.safeParse(row);
    if (!parsed.success) return { status: "unavailable" };

    return parsed.data.allowed
      ? { status: "allowed", remaining: parsed.data.remaining, resetAt: parsed.data.reset_at }
      : { status: "limited", remaining: 0, resetAt: parsed.data.reset_at };
  } catch {
    return { status: "unavailable" };
  }
}
