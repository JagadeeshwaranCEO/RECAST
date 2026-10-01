import { resolveAiProvider } from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

export async function GET() {
  const provider = resolveAiProvider();
  return Response.json(
    {
      status: "ok",
      service: "recast-campaign-studio",
      mode: "deterministic-demo",
      storage: "browser-session",
      checks: {
        application: "ready",
        campaignEngine: "ready",
        agentProvider: provider ? provider.id : "local",
      },
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
