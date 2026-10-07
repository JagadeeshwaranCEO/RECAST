import { resolveAiProvider } from "@/lib/ai-provider";
import { checkSupabaseHealth } from "@/lib/supabase/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const provider = resolveAiProvider();
  const cloudHealth = await checkSupabaseHealth();
  const cloudConfigured = cloudHealth !== "not-configured";
  const healthy = cloudHealth !== "degraded";

  return Response.json(
    {
      status: healthy ? "ok" : "degraded",
      service: "recast-campaign-studio",
      mode: provider ? "hybrid-ai" : "governed-local",
      storage: cloudConfigured ? "supabase-and-browser-session" : "browser-session",
      checks: {
        application: "ready",
        campaignEngine: "ready",
        agentProvider: provider ? provider.id : "local",
        cloudPersistence: cloudHealth,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
