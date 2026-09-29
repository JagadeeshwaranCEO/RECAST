export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      status: "ok",
      service: "recast-campaign-studio",
      mode: "deterministic-demo",
      storage: "browser-session",
      checks: {
        application: "ready",
        campaignEngine: "ready",
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
