import {
  AgentCouncilResultSchema,
  agentSystemPrompt,
  type AgentBrief,
  type AgentCouncilResult,
} from "@/lib/agent-orchestrator";

export const AI_PROVIDER_IDS = ["openrouter", "gemini", "groq", "nvidia", "openai"] as const;
export type AiProviderId = (typeof AI_PROVIDER_IDS)[number];

type ProviderEnvironment = Record<string, string | undefined>;
type Fetcher = typeof fetch;

export type AiProviderConfig = {
  id: AiProviderId;
  label: string;
  apiKey: string;
  model: string;
};

const PROVIDERS: Record<AiProviderId, {
  label: string;
  keyVariable: string;
  modelVariable: string;
  defaultModel: string;
}> = {
  openrouter: {
    label: "OpenRouter",
    keyVariable: "OPENROUTER_API_KEY",
    modelVariable: "OPENROUTER_MODEL",
    defaultModel: "openrouter/free",
  },
  gemini: {
    label: "Google Gemini",
    keyVariable: "GEMINI_API_KEY",
    modelVariable: "GEMINI_MODEL",
    defaultModel: "gemini-flash-lite-latest",
  },
  groq: {
    label: "Groq",
    keyVariable: "GROQ_API_KEY",
    modelVariable: "GROQ_MODEL",
    defaultModel: "openai/gpt-oss-20b",
  },
  nvidia: {
    label: "NVIDIA NIM",
    keyVariable: "NVIDIA_API_KEY",
    modelVariable: "NVIDIA_MODEL",
    defaultModel: "openai/gpt-oss-20b",
  },
  openai: {
    label: "OpenAI",
    keyVariable: "OPENAI_API_KEY",
    modelVariable: "OPENAI_MODEL",
    defaultModel: "gpt-5-mini",
  },
};

export const AGENT_COUNCIL_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    campaignThesis: {
      type: "string",
      description: "One concise strategic thesis that joins the brand promise, audience tension, and approved proof.",
    },
    findings: {
      type: "array",
      minItems: 6,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          agent: { type: "string" },
          role: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" },
          outputs: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
        },
        required: ["id", "agent", "role", "title", "summary", "outputs"],
      },
    },
    channelPlan: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          channel: { type: "string" },
          job: { type: "string" },
          format: { type: "string" },
          deliverable: {
            type: "object",
            additionalProperties: false,
            properties: {
              headline: { type: "string" },
              body: { type: "string" },
              cta: { type: "string" },
              hashtags: { type: "array", maxItems: 5, items: { type: "string" } },
              productionNotes: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
            },
            required: ["headline", "body", "cta", "hashtags", "productionNotes"],
          },
        },
        required: ["channel", "job", "format", "deliverable"],
      },
    },
  },
  required: ["campaignThesis", "findings", "channelPlan"],
} as const;

function configuredProvider(id: AiProviderId, environment: ProviderEnvironment): AiProviderConfig | null {
  const definition = PROVIDERS[id];
  const apiKey = environment[definition.keyVariable]?.trim();
  if (!apiKey) return null;
  return {
    id,
    label: definition.label,
    apiKey,
    model: environment[definition.modelVariable]?.trim() || definition.defaultModel,
  };
}

export function resolveAiProvider(environment: ProviderEnvironment = process.env): AiProviderConfig | null {
  const requested = environment.RECAST_AI_PROVIDER?.trim().toLowerCase();
  if (requested && requested !== "auto") {
    if (!AI_PROVIDER_IDS.includes(requested as AiProviderId)) return null;
    return configuredProvider(requested as AiProviderId, environment);
  }

  for (const id of AI_PROVIDER_IDS) {
    const provider = configuredProvider(id, environment);
    if (provider) return provider;
  }
  return null;
}

function structuredResponseFormat() {
  return {
    type: "json_schema",
    json_schema: {
      name: "recast_campaign_council",
      strict: true,
      schema: AGENT_COUNCIL_JSON_SCHEMA,
    },
  };
}

function chatResponseText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as {
    output_text?: unknown;
    choices?: Array<{ message?: { content?: unknown } }>;
    output?: Array<{ content?: Array<{ text?: unknown }> }>;
  };
  if (typeof record.output_text === "string") return record.output_text;
  const chatContent = record.choices?.[0]?.message?.content;
  if (typeof chatContent === "string") return chatContent;
  if (Array.isArray(chatContent)) {
    const part = chatContent.find((item) => item && typeof item === "object" && "text" in item) as { text?: unknown } | undefined;
    if (typeof part?.text === "string") return part.text;
  }
  for (const item of record.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") return content.text;
    }
  }
  return null;
}

function normalizeJsonText(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

async function requestJson(
  url: string,
  init: RequestInit,
  fetcher: Fetcher,
): Promise<unknown> {
  const response = await fetcher(url, { ...init, signal: AbortSignal.timeout(25_000) });
  if (!response.ok) throw new Error(`AI provider request failed with ${response.status}`);
  return response.json();
}

async function runOpenAiCompatible(
  provider: AiProviderConfig,
  prompt: string,
  fetcher: Fetcher,
): Promise<unknown> {
  const endpoint = provider.id === "openrouter"
    ? "https://openrouter.ai/api/v1/chat/completions"
    : provider.id === "groq"
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://integrate.api.nvidia.com/v1/chat/completions";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${provider.apiKey}`,
  };
  if (provider.id === "openrouter") {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_SITE_URL ?? "https://recast-ai-studio.vercel.app";
    headers["X-Title"] = "RECAST Campaign Studio";
  }
  const responseFormat = provider.id === "nvidia" ? { type: "json_object" } : structuredResponseFormat();
  return requestJson(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: "user", content: prompt }],
      response_format: responseFormat,
      ...(provider.id === "openrouter" ? { provider: { require_parameters: true } } : {}),
      temperature: 0.55,
      max_tokens: 7000,
      stream: false,
    }),
  }, fetcher);
}

async function runGemini(provider: AiProviderConfig, prompt: string, fetcher: Fetcher): Promise<unknown> {
  return requestJson("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": provider.apiKey },
    body: JSON.stringify({
      model: provider.model,
      input: prompt,
      response_format: { type: "text", mime_type: "application/json", schema: AGENT_COUNCIL_JSON_SCHEMA },
    }),
  }, fetcher);
}

async function runOpenAi(provider: AiProviderConfig, prompt: string, fetcher: Fetcher): Promise<unknown> {
  return requestJson("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.apiKey}` },
    body: JSON.stringify({
      model: provider.model,
      input: prompt,
      text: { format: { type: "json_schema", name: "recast_campaign_council", strict: true, schema: AGENT_COUNCIL_JSON_SCHEMA } },
    }),
  }, fetcher);
}

export async function runModelCampaignCouncil(
  brief: AgentBrief,
  options: { environment?: ProviderEnvironment; fetcher?: Fetcher } = {},
): Promise<{ result: AgentCouncilResult; provider: AiProviderConfig } | null> {
  const provider = resolveAiProvider(options.environment ?? process.env);
  if (!provider) return null;
  const fetcher = options.fetcher ?? fetch;
  const prompt = agentSystemPrompt(brief);
  const payload = provider.id === "gemini"
    ? await runGemini(provider, prompt, fetcher)
    : provider.id === "openai"
      ? await runOpenAi(provider, prompt, fetcher)
      : await runOpenAiCompatible(provider, prompt, fetcher);
  const responseText = chatResponseText(payload);
  if (!responseText) throw new Error("AI provider returned no structured response");
  const candidate = JSON.parse(normalizeJsonText(responseText)) as Record<string, unknown>;
  const result = AgentCouncilResultSchema.parse({
    ...candidate,
    mode: "ai",
    provider: provider.id,
    model: provider.model,
    generatedAt: new Date().toISOString(),
  });
  return { result, provider };
}
