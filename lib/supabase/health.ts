const SUPABASE_PROBE_TIMEOUT_MS = 5_000;

export type SupabaseHealth = "ready" | "degraded" | "not-configured";

type SupabaseHealthOptions = {
  environment?: Partial<Pick<NodeJS.ProcessEnv, "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY">>;
  fetcher?: typeof fetch;
};

/**
 * Performs a tiny read through Supabase's Data API. This verifies that the
 * configured project is reachable without using a service-role credential.
 */
export async function checkSupabaseHealth(options: SupabaseHealthOptions = {}): Promise<SupabaseHealth> {
  const environment = options.environment ?? process.env;
  const fetcher = options.fetcher ?? fetch;
  const url = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) return "not-configured";

  try {
    const endpoint = new URL("/rest/v1/campaign_publications", url);
    endpoint.searchParams.set("select", "id");
    endpoint.searchParams.set("limit", "1");

    const response = await fetcher(endpoint, {
      headers: {
        apikey: publishableKey,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(SUPABASE_PROBE_TIMEOUT_MS),
    });

    return response.ok ? "ready" : "degraded";
  } catch {
    return "degraded";
  }
}
