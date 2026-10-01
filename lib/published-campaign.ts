import { z } from "zod";

export const MAX_PUBLICATION_JSON_BYTES = 8_192;
export const MAX_SHARE_PAYLOAD_LENGTH = 12_000;

const LocalCampaignAssetSchema = z.string()
  .trim()
  .min(1)
  .max(240)
  .regex(/^\/assets\/[A-Za-z0-9][A-Za-z0-9._/-]*$/)
  .refine((value) => !value.split("/").includes(".."), "Campaign assets must stay inside /assets.");

export const PublishedCampaignPayloadSchema = z.object({
  brandName: z.string().trim().min(1).max(80),
  productName: z.string().trim().min(1).max(120),
  headline: z.string().trim().min(1).max(110),
  subheadline: z.string().trim().min(1).max(100),
  cta: z.string().trim().min(1).max(50),
  imageUrl: LocalCampaignAssetSchema.optional(),
  backgroundColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  proof: z.string().trim().min(1).max(800),
  thesis: z.string().trim().min(1).max(1_200),
  publishedAt: z.string().datetime({ offset: true }),
}).strict();

export type PublishedCampaignPayload = z.infer<typeof PublishedCampaignPayloadSchema>;

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function parsePublishedCampaignPayload(value: unknown): PublishedCampaignPayload | null {
  const parsed = PublishedCampaignPayloadSchema.safeParse(value);
  if (!parsed.success) return null;
  if (byteLength(JSON.stringify(parsed.data)) > MAX_PUBLICATION_JSON_BYTES) return null;
  return parsed.data;
}

export function parseStoredCampaignPayload(value: string): PublishedCampaignPayload | null {
  if (!value || byteLength(value) > MAX_PUBLICATION_JSON_BYTES) return null;
  try {
    return parsePublishedCampaignPayload(JSON.parse(value));
  } catch {
    return null;
  }
}

export function decodePublishedCampaignPayload(value: string): PublishedCampaignPayload | null {
  if (!value || value.length > MAX_SHARE_PAYLOAD_LENGTH || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atob(padded);
    if (binary.length > MAX_PUBLICATION_JSON_BYTES) return null;
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return parseStoredCampaignPayload(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function encodePublishedCampaignPayload(value: PublishedCampaignPayload): string {
  const payload = PublishedCampaignPayloadSchema.parse(value);
  const text = JSON.stringify(payload);
  if (byteLength(text) > MAX_PUBLICATION_JSON_BYTES) throw new Error("Published campaign payload is too large.");
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
