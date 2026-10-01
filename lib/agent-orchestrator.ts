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
  provider: z.enum(["openrouter", "gemini", "groq", "nvidia", "openai", "local"]),
  model: z.string(),
  campaignThesis: z.string(),
  findings: z.array(AgentFindingSchema).min(4).max(8),
  channelPlan: z.array(z.object({
    channel: z.string(),
    job: z.string(),
    format: z.string(),
    deliverable: z.object({
      headline: z.string(),
      body: z.string(),
      cta: z.string(),
      hashtags: z.array(z.string()).max(5),
      productionNotes: z.array(z.string()).min(1).max(4),
    }),
  })).min(1).max(8),
  generatedAt: z.string(),
});

export type AgentCouncilResult = z.infer<typeof AgentCouncilResultSchema>;

const providerLabels: Record<AgentCouncilResult["provider"], string> = {
  openrouter: "OpenRouter",
  gemini: "Google Gemini",
  groq: "Groq",
  nvidia: "NVIDIA NIM",
  openai: "OpenAI",
  local: "RECAST governed planner",
};

export function aiProviderLabel(provider: AgentCouncilResult["provider"]): string {
  return providerLabels[provider];
}

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

function hashtag(value: string) {
  return `#${value.replace(/[^a-z0-9]/gi, "")}`;
}

function buildChannelDeliverable(channel: string, brief: AgentBrief, proofLead: string) {
  const product = brief.productName;
  const promise = brief.promise.replace(/[.!?]+$/, "");
  const shared = {
    headline: promise,
    cta: `Meet ${product}`,
    hashtags: [hashtag(brief.brandName), hashtag(product), "#DesignedWithProof"],
    productionNotes: ["Use only approved proof", `Voice: ${brief.tone}`, `Market: ${brief.market}`],
  };

  if (channel === "Instagram") return {
    ...shared,
    body: `${promise}.\n\n${proofLead}. Built for ${brief.audience.toLowerCase()}.\n\nSave this for the moment your day changes—and take the same point of view with you.`,
    productionNotes: ["4:5 hero first", "Carousel: tension → proof → detail → CTA", "Keep the first 125 characters self-contained"],
  };
  if (channel === "LinkedIn") return {
    ...shared,
    body: `Most products are presented as a list of features. We started with a human tension instead: ${brief.challenge}.\n\nThat led to ${product}—${brief.promise.toLowerCase()}. The proof is specific: ${proofLead}.\n\nThe campaign gives every channel a different job while keeping one source of truth.`,
    hashtags: [hashtag(brief.brandName), "#BrandStrategy", "#CreativeOperations"],
    productionNotes: ["Lead with the design decision", "Break before the proof paragraph", "Pair with the 1:1 proof card"],
  };
  if (channel === "X") return {
    ...shared,
    body: `1/ ${promise}.\n\n2/ The tension: ${brief.challenge}.\n\n3/ The proof: ${proofLead}.\n\n4/ One campaign truth. Native executions. ${shared.cta}.`,
    hashtags: [hashtag(brief.brandName)],
    productionNotes: ["Publish as a four-post thread", "Attach the proof card to post 3", "Pin the CTA reply"],
  };
  if (channel === "YouTube Shorts" || channel === "TikTok") return {
    ...shared,
    headline: `What changes when your day does?`,
    body: `00–03s — Show the tension: ${brief.challenge}.\n03–08s — Reveal ${product}.\n08–12s — Prove it: ${proofLead}.\n12–15s — ${promise}. ${shared.cta}.`,
    hashtags: [hashtag(brief.brandName), "#Shorts", "#DesignedWithProof"],
    productionNotes: ["9:16 safe crop", "Burn in captions", "Reveal proof before the CTA"],
  };
  if (channel === "Email") return {
    ...shared,
    headline: `${promise} — meet ${product}`,
    body: `You should not have to choose between a product that looks right and one that keeps up. ${product} is built around one promise: ${brief.promise}.\n\nApproved proof: ${proofLead}.\n\n${shared.cta}.`,
    hashtags: [],
    productionNotes: ["Subject under 55 characters", "One hero image", "Repeat one CTA after proof"],
  };
  if (channel === "Out-of-home") return {
    ...shared,
    body: `${proofLead}.`,
    hashtags: [],
    productionNotes: ["Seven-word headline target", "One proof line", "High-contrast CTA or URL"],
  };
  return {
    ...shared,
    body: `${promise}. ${proofLead}. ${shared.cta}.`,
    productionNotes: ["Adapt to the native format", "Keep the approved proof visible", "Use one unambiguous CTA"],
  };
}

export function runLocalCampaignCouncil(input: AgentBrief): AgentCouncilResult {
  const brief = AgentBriefSchema.parse(input);
  const brand = brief.brandName;
  const product = brief.productName;
  const audience = brief.audience;
  const proofLead = brief.proof.split(/[·.;\n]/).map((item) => item.trim()).find(Boolean) ?? "approved product evidence";

  return {
    mode: "local",
    provider: "local",
    model: "recast-governed-planner-r2",
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
      deliverable: buildChannelDeliverable(channel, brief, proofLead),
    })),
  };
}

export function agentSystemPrompt(brief: AgentBrief): string {
  return [
    "You are the RECAST campaign council: research, strategy, copy, art direction, claims, and activation agents.",
    "Return valid JSON only. Keep every recommendation grounded in the supplied brand brief.",
    "Return exactly three top-level fields: campaignThesis, findings, and channelPlan. Runtime provenance is added by the server.",
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
    "For every channelPlan item, write a complete publish-ready deliverable: headline, body, CTA, optional hashtags, and production notes. Do not return placeholders.",
  ].join("\n");
}
