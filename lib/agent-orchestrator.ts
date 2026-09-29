import { z } from "zod";

export const AgentBriefSchema = z.object({
  brandName: z.string().trim().min(1).max(80),
  productName: z.string().trim().min(1).max(120),
  challenge: z.string().trim().min(1).max(500),
  audience: z.string().trim().min(1).max(300),
  objective: z.string().trim().min(1).max(300),
  promise: z.string().trim().min(1).max(220),
  proof: z.string().trim().min(1).max(800),
  tone: z.string().trim().min(1).max(180),
  market: z.string().trim().min(1).max(120),
  channels: z.array(z.string().trim().min(1).max(40)).min(1).max(8),
}).strict();

export type AgentBrief = z.infer<typeof AgentBriefSchema>;

export const AgentFindingSchema = z.object({
  id: z.string(),
  agent: z.string(),
  role: z.string(),
  title: z.string(),
  summary: z.string(),
  outputs: z.array(z.string()).min(1).max(5),
});

export const AgentCouncilResultSchema = z.object({
  mode: z.enum(["ai", "local"]),
  campaignThesis: z.string(),
  findings: z.array(AgentFindingSchema).min(4).max(8),
  channelPlan: z.array(z.object({ channel: z.string(), job: z.string(), format: z.string() })).min(1).max(8),
  generatedAt: z.string(),
});

export type AgentCouncilResult = z.infer<typeof AgentCouncilResultSchema>;

const channelFormats: Record<string, string> = {
  Instagram: "Reel + carousel + story",
  LinkedIn: "Founder post + document carousel",
  "YouTube Shorts": "15-second vertical film",
  TikTok: "Native vertical story",
  X: "Launch thread + proof card",
  Email: "Three-message launch sequence",
  Website: "Campaign landing page",
  Pinterest: "Editorial pin set",
};

export function runLocalCampaignCouncil(input: AgentBrief): AgentCouncilResult {
  const brief = AgentBriefSchema.parse(input);
  const brand = brief.brandName;
  const product = brief.productName;
  const audience = brief.audience;
  const proofLead = brief.proof.split(/[·.;\n]/).map((item) => item.trim()).find(Boolean) ?? "approved product evidence";

  return {
    mode: "local",
    campaignThesis: `${brand} should make ${product} feel like the most credible way for ${audience} to ${brief.promise.toLowerCase()}, using ${proofLead.toLowerCase()} as proof rather than decoration.`,
    generatedAt: new Date().toISOString(),
    findings: [
      {
        id: "agent-research",
        agent: "Scout",
        role: "Research agent",
        title: "Category tension",
        summary: `The strongest territory sits inside the problem: ${brief.challenge}. Build the campaign around the unresolved human tension, not a list of product features.`,
        outputs: ["Audience tension map", "Category convention to challenge", `Market lens: ${brief.market}`],
      },
      {
        id: "agent-strategy",
        agent: "North",
        role: "Strategy agent",
        title: "Single campaign spine",
        summary: `${brief.promise} becomes the governing promise. Every channel should express the same idea while doing a different job in the journey.`,
        outputs: ["One-line proposition", "Channel roles", "Message hierarchy"],
      },
      {
        id: "agent-copy",
        agent: "Voice",
        role: "Copy agent",
        title: "Voice system",
        summary: `Write in a ${brief.tone.toLowerCase()} voice. Lead with recognition, prove with specifics, and close with one unambiguous action.`,
        outputs: [`Hero: “${brief.promise}.”`, `Proof line: “${proofLead}.”`, `CTA: “Meet ${product}”`],
      },
      {
        id: "agent-art",
        agent: "Frame",
        role: "Art direction agent",
        title: "Visual grammar",
        summary: "Use one repeatable composition across formats: a decisive subject, one oversized message, one proof detail, and generous negative space for platform-safe crops.",
        outputs: ["Poster system", "1:1 / 4:5 / 9:16 crops", "Locked logo and color zones"],
      },
      {
        id: "agent-compliance",
        agent: "Proof",
        role: "Claims agent",
        title: "Evidence boundary",
        summary: `Only publish claims supported by: ${brief.proof}. Treat unsupported superlatives, guarantees and comparison claims as review blockers.`,
        outputs: ["Approved claim list", "Risk words", "Required human sign-off"],
      },
      {
        id: "agent-media",
        agent: "Pulse",
        role: "Activation agent",
        title: "Launch sequence",
        summary: "Open with attention, follow with product proof, then retarget with the clearest conversion asset. Schedule channel variants independently instead of cross-posting identical copy.",
        outputs: ["72-hour launch cadence", "Per-channel CTA", "UTM-ready destinations"],
      },
    ],
    channelPlan: brief.channels.map((channel, index) => ({
      channel,
      job: index === 0 ? "Create recognition" : index === brief.channels.length - 1 ? "Convert intent" : "Build proof",
      format: channelFormats[channel] ?? "Native channel asset",
    })),
  };
}

export function agentSystemPrompt(brief: AgentBrief): string {
  return [
    "You are the RECAST campaign council: research, strategy, copy, art direction, claims, and activation agents.",
    "Return valid JSON only. Keep every recommendation grounded in the supplied brand brief.",
    "Never invent product claims, awards, testimonials, prices, performance numbers, or legal approvals.",
    "Make channel outputs native to each platform while preserving one campaign thesis.",
    `BRAND: ${brief.brandName}`,
    `PRODUCT: ${brief.productName}`,
    `CHALLENGE: ${brief.challenge}`,
    `AUDIENCE: ${brief.audience}`,
    `OBJECTIVE: ${brief.objective}`,
    `PROMISE: ${brief.promise}`,
    `APPROVED PROOF: ${brief.proof}`,
    `VOICE: ${brief.tone}`,
    `MARKET: ${brief.market}`,
    `CHANNELS: ${brief.channels.join(", ")}`,
  ].join("\n");
}
