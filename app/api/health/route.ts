import { resolveAiProvider } from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

export async function GET() {
  const provider = resolveAiProvider();
  const cloudConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  return Response.json(
    {
      status: "ok",
      service: "recast-campaign-studio",
      mode: provider ? "hybrid-ai" : "governed-local",
      storage: cloudConfigured ? "supabase-and-browser-session" : "browser-session",
      checks: {
        application: "ready",
        campaignEngine: "ready",
        agentProvider: provider ? provider.id : "local",
        cloudPersistence: cloudConfigured ? "configured" : "optional",
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
